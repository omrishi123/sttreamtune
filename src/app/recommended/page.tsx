
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

// Helper function to serialize any object with a 'toDate' method (like Firestore Timestamps)
const serializeTimestamps = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value.toDate === 'function') {
      newObj[key] = value.toDate().toISOString();
    } else {
      newObj[key] = serializeTimestamps(value);
    }
  }
  return newObj;
};

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

export default function RecommendedPage() {
    const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasHistory, setHasHistory] = useState(false);
    
    const { recentlyPlayed, playlists: userPlaylists, communityPlaylists, getTrackById, addTracksToCache } = useUserData();
    const { setContinuationToken } = usePlayer();
    const observer = useRef<IntersectionObserver>();

    const fetchRecommendations = useCallback(async (isInitialLoad: boolean, currentContinuationToken: string | null = null) => {
        if (!isInitialLoad && (!currentContinuationToken || isFetchingMore)) return;
        
        if (isInitialLoad) {
            setIsLoading(true);
            setRecommendedTracks([]);
            setContinuationToken(null);
        } else {
            setIsFetchingMore(true);
        }

        try {
            const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
            setHasHistory(recentTracks.length > 0 || userPlaylists.length > 0);
            
            if (recentTracks.length === 0 && userPlaylists.length === 0 && isInitialLoad) {
                setIsLoading(false);
                return;
            }

            const plainCommunityPlaylists = serializeTimestamps(communityPlaylists);
            const plainUserPlaylists = serializeTimestamps(userPlaylists);
            const plainRecentTracks = serializeTimestamps(recentTracks);

            const results = await generateRecommendations({
                recentlyPlayed: plainRecentTracks,
                userPlaylists: plainUserPlaylists,
                communityPlaylists: plainCommunityPlaylists,
                continuationToken: isInitialLoad ? undefined : currentContinuationToken,
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
    }, [isFetchingMore, recentlyPlayed, getTrackById, userPlaylists, communityPlaylists, addTracksToCache, setContinuationToken]);
    
    const tokenForNextFetch = usePlayer().continuationToken;

    useEffect(() => {
        // We only want this to run once on initial load.
        // The context will handle subsequent fetches.
        fetchRecommendations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lastTrackElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && tokenForNextFetch && !isFetchingMore) {
                fetchRecommendations(false, tokenForNextFetch);
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingMore, fetchRecommendations, tokenForNextFetch]);

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
