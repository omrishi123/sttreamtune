
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserData } from '@/context/user-data-context';
import { generateRecommendations, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Playlist, Track } from '@/lib/types';
import { usePlayer } from '@/context/player-context';

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

// Client-side helpers to generate queries
const getTopArtists = (recentlyPlayed: Track[], count: number): string[] => {
  if (!recentlyPlayed.length) return [];
  const artistCounts: { [artist: string]: number } = {};
  recentlyPlayed.forEach(track => {
    if (track.artist && track.artist !== 'Unknown Artist') {
      artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
    }
  });
  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
};

const getPlaylistDnaQueries = (userPlaylists: Playlist[], communityPlaylists: Playlist[], count: number): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    const dnaMatches: { query: string; score: number }[] = [];

    communityPlaylists.forEach(publicPlaylist => {
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        if (matchCount > 0) {
            dnaMatches.push({ query: publicPlaylist.name, score: matchCount });
        }
    });

    return dnaMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(match => match.query);
};

export default function RecommendedPage() {
    const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasHistory, setHasHistory] = useState(false);
    const [continuationToken, setContinuationToken] = useState<string | null>(null);
    const [initialQuery, setInitialQuery] = useState<string | null>(null);
    
    const { recentlyPlayed, playlists: userPlaylists, communityPlaylists, getTrackById, addTracksToCache } = useUserData();
    const observer = useRef<IntersectionObserver>();

    const fetchRecommendations = useCallback(async (isInitialLoad: boolean) => {
        if (!isInitialLoad && (!continuationToken || isFetchingMore)) return;
        
        let query = initialQuery;

        if (isInitialLoad) {
            setIsLoading(true);
            setRecommendedTracks([]);
            setContinuationToken(null);
            
            const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
            setHasHistory(recentTracks.length > 0 || userPlaylists.length > 0);
            
            if (recentTracks.length === 0 && userPlaylists.length === 0) {
                setIsLoading(false);
                return;
            }

            const topArtists = getTopArtists(recentTracks, 2);
            const dnaQueries = getPlaylistDnaQueries(userPlaylists, communityPlaylists, 3);
            const searchQueries = [...new Set([...topArtists, ...dnaQueries])];
            
            if (searchQueries.length === 0) {
                setIsLoading(false);
                return;
            }

            query = searchQueries.join(' | ');
            setInitialQuery(query);

        } else {
            setIsFetchingMore(true);
        }

        if (!query) {
             setIsLoading(false);
             setIsFetchingMore(false);
             return;
        }

        try {
            const results = await generateRecommendations({
                query: query,
                continuationToken: isInitialLoad ? undefined : continuationToken,
                userHistory: { recentlyPlayed, userPlaylists },
            });
            
            addTracksToCache(results.tracks);
            
            if (isInitialLoad) {
                setRecommendedTracks(results.tracks);
            } else {
                setRecommendedTracks(prev => [...prev, ...results.tracks]);
            }
            setContinuationToken(results.nextContinuationToken);

        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, continuationToken, initialQuery, recentlyPlayed, getTrackById, userPlaylists, communityPlaylists, addTracksToCache]);
    
    useEffect(() => {
        fetchRecommendations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lastTrackElementRef = useCallback((node: HTMLDivElement) => {
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
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    Recommended For You
                </h1>
                <p className="text-muted-foreground mt-2">
                    An endless feed of music based on your listening habits.
                </p>
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
                                We need to know what you like first. Play some songs to get personalized recommendations.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/search">Go to Search</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : recommendedTracks.length > 0 ? (
                    <>
                        <TrackList tracks={recommendedTracks} playlist={{...recommendedPlaylist, trackIds: recommendedTracks.map(t => t.id)}} onTrackRendered={lastTrackElementRef} />
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
