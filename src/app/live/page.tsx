
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/player-context';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { searchLiveStreams, LiveStreamSearchOutput } from '@/ai/flows/search-live-streams-flow';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Track } from '@/lib/types';

const liveCategories = [
    { name: 'Indian News', query: 'indian news' },
    { name: 'Live Music', query: 'live music performance' },
    { name: 'DJ Sets', query: 'live dj set' },
    { name: 'Full Concerts', query: 'full concert' },
    { name: '24/7 Radio', query: '24/7 music radio' },
];

const LiveStreamCard = ({ stream, onPlay }: { stream: Track, onPlay: (stream: Track) => void }) => (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:bg-card/90 h-full flex flex-col">
        <div className="relative">
            <Image
                src={stream.artwork}
                alt={stream.title}
                width={300}
                height={168}
                className="aspect-video object-cover transition-transform group-hover:scale-105"
                data-ai-hint={stream['data-ai-hint']}
                unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => onPlay(stream)}
            >
                <Play className="h-12 w-12 text-white/80 fill-white/80" />
            </div>
             <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold uppercase px-2 py-1 rounded-md">
                LIVE
            </div>
        </div>
        <CardHeader className="p-3 flex-1">
            <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary leading-tight">
                {stream.title}
            </CardTitle>
            <CardDescription className="text-xs truncate mt-1">
                {stream.artist}
            </CardDescription>
        </CardHeader>
    </Card>
);

export default function LivePage() {
    const [selectedCategory, setSelectedCategory] = useState(liveCategories[0]);
    const [liveStreams, setLiveStreams] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [continuationToken, setContinuationToken] = useState<string | null>(null);

    const { setQueueAndPlay } = usePlayer();
    const { addTrackToCache } = useUserData();
    const { toast } = useToast();
    const observer = useRef<IntersectionObserver>();

    const fetchLiveStreams = useCallback(async (category: typeof selectedCategory, isNewSearch: boolean) => {
        if (isNewSearch) {
            setIsLoading(true);
            setLiveStreams([]);
            setContinuationToken(null);
        } else {
            if (!continuationToken) return;
            setIsFetchingMore(true);
        }

        try {
            const results = await searchLiveStreams({ 
                query: category.query,
                continuationToken: isNewSearch ? undefined : continuationToken,
            });

            if (isNewSearch) {
                setLiveStreams(results.tracks);
                if (results.tracks.length === 0) {
                     toast({
                        title: 'No Live Streams Found',
                        description: `Could not find any live streams for "${category.name}".`,
                    });
                }
            } else {
                setLiveStreams(prev => [...prev, ...results.tracks]);
            }
            
            setContinuationToken(results.nextContinuationToken);
            addTrackToCache(results.tracks);

        } catch (error: any) {
            console.error('Live search failed:', error);
            toast({
                variant: 'destructive',
                title: 'Search Failed',
                description: 'Could not perform search for live streams.',
            });
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [toast, addTrackToCache, continuationToken]);

    useEffect(() => {
        fetchLiveStreams(selectedCategory, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);
    
    const lastStreamElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && continuationToken && !isFetchingMore) {
                fetchLiveStreams(selectedCategory, false);
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, continuationToken, isFetchingMore, fetchLiveStreams, selectedCategory]);


    const handlePlayStream = (stream: Track) => {
        setQueueAndPlay([stream], stream.id);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    Live Now
                </h1>
                <p className="text-muted-foreground mt-2">
                    Discover live music, DJ sets, and concerts happening now.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {liveCategories.map((category) => (
                    <Button
                        key={category.name}
                        variant={selectedCategory.name === category.name ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category)}
                        disabled={isLoading || isFetchingMore}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>

            <section>
                {isLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <div key={i} className="space-y-2">
                               <Skeleton className="h-[168px] w-full" />
                               <Skeleton className="h-4 w-3/4" />
                               <Skeleton className="h-4 w-1/2" />
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {liveStreams.map((stream, index) => {
                            const isLastElement = liveStreams.length === index + 1;
                            return (
                                <div ref={isLastElement ? lastStreamElementRef : null} key={`${stream.id}-${index}`}>
                                    <LiveStreamCard stream={stream} onPlay={handlePlayStream} />
                                </div>
                            );
                        })}
                    </div>
                )}
                 {isFetchingMore && (
                    <div className="flex justify-center items-center py-6 col-span-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
            </section>
        </div>
    );
}
