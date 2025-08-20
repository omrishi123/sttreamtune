
'use client';

import React, { useState, useEffect } from 'react';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCachedRecommendations, getSearchHistory } from '@/lib/recommendations';

export default function RecommendedPage() {
    const [recommendedTracks, setRecommendedTracks] = useState<GenerateRecommendationsOutput>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSearchHistory, setHasSearchHistory] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true);
            const history = getSearchHistory();
            setHasSearchHistory(history.length > 0);
            
            if (history.length > 0) {
                const { tracks } = await getCachedRecommendations();
                setRecommendedTracks(tracks);
            }
            
            setIsLoading(false);
        };

        fetchRecommendations();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    Recommended For You
                </h1>
                <p className="text-muted-foreground mt-2">
                    Based on your recent searches.
                </p>
            </div>

            <section>
                {isLoading ? (
                     <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : !hasSearchHistory ? (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">Nothing to recommend yet!</h2>
                        <p className="text-muted-foreground mt-2">
                            Search for some songs to get personalized recommendations.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/search">Go to Search</Link>
                        </Button>
                    </div>
                ) : (
                    <TrackList tracks={recommendedTracks} />
                )}
            </section>
        </div>
    );
}
