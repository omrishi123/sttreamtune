

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserData } from '@/context/user-data-context';
import { generateRecommendations, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import type { Playlist, Track, UserMusicProfile } from '@/lib/types';
import { getSearchHistory, clearRecommendationsCache } from '@/lib/recommendations';
import { useToast } from '@/hooks/use-toast';

const recommendedPlaylist: Playlist = {
    id: 'recommended-for-you',
    name: 'Recommended For You',
    description: "An endless feed of music based on your listening habits.",
    owner: "StreamTune AI",
    public: false,
    trackIds: [],
    coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
    'data-ai-hint': 'infinite galaxy',
};

// #region Client-Side Profile Generation (Copied from home page)
const getWeightedArtists = (recentlyPlayed: Track[]): string[] => {
    if (recentlyPlayed.length === 0) return [];
    const scores: Record<string, number> = {};
    const now = Date.now();
    recentlyPlayed.forEach(track => {
        if (!track.artist || track.artist === 'Unknown Artist' || !track.playedAt) return;
        const ageHours = (now - track.playedAt) / 36e5;
        const weight = Math.exp(-ageHours / 48);
        scores[track.artist] = (scores[track.artist] || 0) + weight;
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([artist]) => artist);
};

const extractKeywords = (searches: string[]): string[] => {
    const blacklist = ['song', 'music', 'video', 'official', 'lyrics', 'audio', 'hd'];
    const words: Record<string, number> = {};
    searches.forEach(q => {
        q.toLowerCase().split(/\s+/).forEach(w => {
            if (w.length < 3 || blacklist.includes(w) || !isNaN(Number(w))) return;
            words[w] = (words[w] || 0) + 1;
        });
    });
    return Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
};

const getPlaylistDna = (userPlaylists: Playlist[], communityPlaylists: Playlist[]): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    if (userTrackIds.size === 0) return [];
    const dnaMatches: { query: string; score: number }[] = [];
    communityPlaylists.forEach(publicPlaylist => {
        if (publicPlaylist.trackIds.length === 0) return;
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        const overlapPercentage = matchCount / publicPlaylist.trackIds.length;
        if (overlapPercentage > 0.1) {
            dnaMatches.push({ query: publicPlaylist.name, score: overlapPercentage });
        }
    });
    return dnaMatches.sort((a, b) => b.score - a.score).slice(0, 3).map(match => match.query);
};

const buildUserMusicProfile = (
    recentlyPlayed: Track[],
    searchHistory: string[],
    userPlaylists: Playlist[],
    communityPlaylists: Playlist[]
): UserMusicProfile => {
    const topArtists = getWeightedArtists(recentlyPlayed);
    const topKeywords = extractKeywords(searchHistory);
    const playlistDna = getPlaylistDna(userPlaylists, communityPlaylists);
    const dominantGenres = [...new Set([...topKeywords, ...playlistDna])];
    return { topArtists, topKeywords, dominantGenres, energyLevel: 'normal', freshnessBias: 0.5 };
};
// #endregion

export default function RecommendedPage() {
    const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasHistory, setHasHistory] = useState(true);
    
    // State for pagination
    const [continuationToken, setContinuationToken] = useState<string | null>(null);
    const [continuationQuery, setContinuationQuery] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserMusicProfile | null>(null);

    const { recentlyPlayed, playlists: userPlaylists, communityPlaylists, getTrackById, addTracksToCache, likedSongs } = useUserData();
    const { toast } = useToast();
    const observer = useRef<IntersectionObserver>();

    const fetchRecommendations = useCallback(async (isInitialLoad: boolean, isManualRefresh: boolean = false) => {
        if (!isInitialLoad && (!continuationToken || isFetchingMore)) return;

        if (isInitialLoad) {
            setIsLoading(true);
            setRecommendedTracks([]);
            setContinuationToken(null);
            setContinuationQuery(null);
            if (isManualRefresh) {
                clearRecommendationsCache();
            }
        } else {
            setIsFetchingMore(true);
        }

        try {
            let profile = userProfile;
            let queries: string[] = [];

            if (isInitialLoad || !profile) {
                const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
                const searchHistory = getSearchHistory();
                
                setHasHistory(recentTracks.length > 0 || searchHistory.length > 0 || userPlaylists.length > 0);

                profile = buildUserMusicProfile(recentTracks, searchHistory, userPlaylists, communityPlaylists);
                setUserProfile(profile);

                const generatedQueries: string[] = [];
                if (profile.topArtists.length > 0) {
                    generatedQueries.push(`${profile.topArtists[0]} similar artists`);
                    if (profile.topKeywords.length > 0) {
                        generatedQueries.push(`${profile.topArtists[0]} ${profile.topKeywords[0]} music`);
                    }
                }
                profile.topKeywords.forEach(kw => generatedQueries.push(`${kw} vibe songs`));
                profile.dominantGenres.forEach(g => generatedQueries.push(`${g} playlist`);
                
                queries = [...new Set(generatedQueries)];
            }
            
            if (!profile) {
                setHasHistory(false);
                throw new Error("Could not build user profile.");
            }

            const results = await generateRecommendations({
                profile,
                queries: isInitialLoad ? queries : [], // Only send queries on initial load
                userHistory: {
                    recentlyPlayedIds: recentlyPlayed,
                    likedSongIds: likedSongs,
                },
                continuationToken: isInitialLoad ? undefined : continuationToken,
                queryToContinue: isInitialLoad ? undefined : continuationQuery
            });

            addTracksToCache(results.tracks);

            setRecommendedTracks(prev => isInitialLoad ? results.tracks : [...prev, ...results.tracks]);
            setContinuationToken(results.nextContinuationToken);
            setContinuationQuery(results.continuationQuery);
            
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
            setHasHistory(false);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, continuationToken, continuationQuery, userProfile, recentlyPlayed, getTrackById, userPlaylists, communityPlaylists, likedSongs, addTracksToCache]);

    useEffect(() => {
        fetchRecommendations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        toast({
            title: "Refreshing Recommendations",
            description: "Getting a fresh batch of songs for you...",
        });
        fetchRecommendations(true, true);
    }
    
    const lastTrackElementRef = useCallback((node: HTMLTableRowElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && continuationToken && !isFetchingMore) {
                fetchRecommendations(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingMore, fetchRecommendations, continuationToken]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight">
                        Recommended For You
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        An endless feed of music based on your listening habits.
                    </p>
                </div>
                <Button onClick={handleRefresh} variant="outline" disabled={isLoading || isFetchingMore}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset & Refresh
                </Button>
            </div>

            <section>
                {isLoading ? (
                     <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : !hasHistory ? (
                     <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/50 col-span-full">
                        <CardContent className="p-0 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Nothing to recommend yet!</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                We need to know what you like first. Play some songs or search for music to get personalized recommendations.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/search">Go to Search</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : recommendedTracks.length > 0 ? (
                    <>
                        <TrackList 
                            tracks={recommendedTracks} 
                            playlist={{...recommendedPlaylist, trackIds: recommendedTracks.map(t => t.id)}} 
                            onTrackRendered={lastTrackElementRef} 
                        />
                        {isFetchingMore && (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </>
                ) : (
                     <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/50 col-span-full">
                        <CardContent className="p-0 space-y-4">
                             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Could not generate recommendations</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Please try playing a few more songs and check back later.
                            </p>
                             <Button asChild className="mt-6">
                                <Link href="/search">Go to Search</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
    );
}
