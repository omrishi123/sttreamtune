
'use client';

import React, { useState, useEffect } from 'react';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { generateRecommendations, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper to get search history from localStorage
const getSearchHistory = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error("Failed to get search history:", error);
        return [];
    }
}

export default function RecommendedPage() {
    const [recommendedTracks, setRecommendedTracks] = useState<GenerateRecommendationsOutput>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addTracksToCache } = useUserData();
    const { toast } = useToast();
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    useEffect(() => {
        const history = getSearchHistory();
        setSearchHistory(history);
        
        if (history.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                const results = await generateRecommendations({ history });
                addTracksToCache(results);
                setRecommendedTracks(results);
            } catch (error: any) {
                console.error('Failed to fetch recommendations:', error);
                toast({
                    variant: 'destructive',
                    title: 'Recommendation Failed',
                    description: 'Could not fetch recommendations based on your history.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                ) : searchHistory.length === 0 ? (
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
