
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { searchYoutube, YoutubeSearchOutput } from "@/ai/flows/search-youtube-flow";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { clearAllRecommendationCaches, updateSearchHistory } from "@/lib/recommendations";
import { Track } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);

  const { setQueueAndPlay, setContinuationToken: setPlayerContinuationToken, setSearchQuery: setPlayerSearchQuery } = usePlayer();
  const { addTracksToCache } = useUserData();
  const { toast } = useToast();

  const observer = useRef<IntersectionObserver>();

  const loadMore = useCallback(async () => {
    if (!query || !continuationToken || isFetchingMore) return;
    
    setIsFetchingMore(true);
    try {
      const searchResults = await searchYoutube({ 
        query: query,
        continuationToken: continuationToken,
      });
      addTracksToCache(searchResults.tracks);
      setResults(prev => [...prev, ...searchResults.tracks]);
      setContinuationToken(searchResults.nextContinuationToken);
    } catch (error: any) {
      console.error("Failed to fetch more results:", error);
      toast({
        variant: "destructive",
        title: "Error loading more results",
        description: "Could not fetch the next set of songs.",
      });
    } finally {
      setIsFetchingMore(false);
    }
  }, [query, continuationToken, isFetchingMore, addTracksToCache, toast]);

  const lastTrackElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && continuationToken && !isFetchingMore) {
        loadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, continuationToken, isFetchingMore, loadMore]);


  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return;

    setIsLoading(true);
    setResults([]);
    setContinuationToken(null);
    setPlayerContinuationToken(null);
    setPlayerSearchQuery(null);

    try {
      const searchResults = await searchYoutube({ query: searchQuery });
      addTracksToCache(searchResults.tracks);
      setResults(searchResults.tracks);
      setContinuationToken(searchResults.nextContinuationToken);

       if (searchResults.tracks.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      } else {
        updateSearchHistory(searchQuery);
        clearAllRecommendationCaches();
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      const isApiError = error.message?.includes('403');
      toast({
        variant: "destructive",
        title: isApiError ? "YouTube API Error" : "Search Failed",
        description: isApiError 
          ? "The request was forbidden. Please check your YouTube API key and ensure the 'YouTube Data API v3' is enabled in your Google Cloud project."
          : "Could not perform search. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
        handleSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handlePlayTrack = (trackId: string) => {
    // When playing from search, set the context for the infinite queue
    setPlayerSearchQuery(query); 
    setPlayerContinuationToken(continuationToken);
    setQueueAndPlay(results, trackId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Search</h1>
        <form onSubmit={onFormSubmit} className="mt-4">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search for songs, artists, playlists..."
              className="max-w-md text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>
      </div>

      <section>
        <h2 className="text-xl font-semibold font-headline mb-4">Results</h2>
        {isLoading && results.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((track, index) => {
              const isLastElement = results.length === index + 1;
              return (
                <div
                  key={`${track.id}-${index}`}
                  ref={isLastElement ? lastTrackElementRef : null}
                  className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => handlePlayTrack(track.id)}
                >
                  <Image
                    src={track.artwork}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded-md"
                    data-ai-hint={track['data-ai-hint']}
                    unoptimized
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <Play className="h-5 w-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {isFetchingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </section>
    </div>
  );
}
