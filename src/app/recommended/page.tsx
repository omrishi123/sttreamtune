
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
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

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
                    Based on your recent searches, here are some tracks you might like.
                </p>
            </div>

            <section>
                {isLoading ? (
                     <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : !hasSearchHistory ? (
                     <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/50 col-span-full">
                        <CardContent className="p-0 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Nothing to recommend yet!</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                We need to know what you like first. Search for a few songs to get personalized recommendations.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/search">Go to Search</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : recommendedTracks.length > 0 ? (
                    <TrackList tracks={recommendedTracks} />
                ) : (
                     <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/50 col-span-full">
                        <CardContent className="p-0 space-y-4">
                             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Could not generate recommendations</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                The AI might be busy. Please try searching for a few more songs and check back later.
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
