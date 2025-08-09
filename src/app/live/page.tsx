
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/player-context';
import { useUserData } from '@/context/user-data-context';
import { useToast } from '@/hooks/use-toast';
import { searchLiveStreams, LiveStreamSearchOutput } from '@/ai/flows/search-live-streams-flow';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const liveCategories = [
    { name: 'Indian News', query: 'indian news live' },
    { name: 'Live Music', query: 'live music performance' },
    { name: 'DJ Sets', query: 'live dj set' },
    { name: 'Full Concerts', query: 'full concert live' },
    { name: '24/7 Radio', query: '24/7 live radio music' },
];

const LiveStreamCard = ({ stream, onPlay }: { stream: LiveStreamSearchOutput[0], onPlay: (stream: LiveStreamSearchOutput[0]) => void }) => (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:bg-card/90 h-full flex flex-col">
        <CardContent className="p-0 relative">
            <Image
                src={stream.artwork}
                alt={stream.title}
                width={300}
                height={168}
                className="aspect-video object-cover transition-transform group-hover:scale-105"
                data-ai-hint={stream['data-ai-hint']}
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
        </CardContent>
        <CardHeader className="p-3 flex-1">
            <CardTitle className="text-sm font-semibold truncate group-hover:text-primary leading-tight">
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
    const [liveStreams, setLiveStreams] = useState<LiveStreamSearchOutput>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setQueueAndPlay } = usePlayer();
    const { addTrackToCache } = useUserData();
    const { toast } = useToast();

    const fetchLiveStreams = useCallback(async (category: typeof selectedCategory) => {
        setIsLoading(true);
        setLiveStreams([]);
        try {
            const results = await searchLiveStreams({ query: category.query });
            setLiveStreams(results);
            if (results.length === 0) {
                toast({
                    title: 'No Live Streams Found',
                    description: `Could not find any live streams for "${category.name}".`,
                });
            }
        } catch (error: any) {
            console.error('Live search failed:', error);
            const isApiError = error.message?.includes('403');
            toast({
                variant: 'destructive',
                title: isApiError ? 'YouTube API Error' : 'Search Failed',
                description: isApiError
                    ? "The request was forbidden. Please check your YouTube API key and ensure the 'YouTube Data API v3' is enabled."
                    : 'Could not perform search for live streams.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLiveStreams(selectedCategory);
    }, [selectedCategory, fetchLiveStreams]);

    const handlePlayStream = (stream: LiveStreamSearchOutput[0]) => {
        addTrackToCache(stream);
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
                        {liveStreams.map((stream) => (
                            <LiveStreamCard key={stream.id} stream={stream} onPlay={handlePlayStream} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
