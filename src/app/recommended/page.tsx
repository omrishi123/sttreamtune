
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/player-context';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { getTrendingSongs, TrendingSongsOutput } from '@/ai/flows/get-trending-songs-flow';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackList } from '@/components/track-list';


export default function RecommendedPage() {
    const [trendingTracks, setTrendingTracks] = useState<TrendingSongsOutput>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addTracksToCache } = useUserData();
    const { toast } = useToast();

    useEffect(() => {
        const fetchTrendingSongs = async () => {
            setIsLoading(true);
            try {
                const results = await getTrendingSongs();
                addTracksToCache(results);
                setTrendingTracks(results);
            } catch (error: any) {
                console.error('Failed to fetch trending songs:', error);
                const isApiError = error.message?.includes('403');
                toast({
                    variant: 'destructive',
                    title: isApiError ? 'YouTube API Error' : 'Fetch Failed',
                    description: isApiError
                        ? "The request was forbidden. Please check your YouTube API key and ensure the 'YouTube Data API v3' is enabled."
                        : 'Could not fetch trending songs.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrendingSongs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    Recommended For You
                </h1>
                <p className="text-muted-foreground mt-2">
                    Discover the top trending songs in India right now.
                </p>
            </div>

            <section>
                {isLoading ? (
                     <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <TrackList tracks={trendingTracks} />
                )}
            </section>
        </div>
    );
}
