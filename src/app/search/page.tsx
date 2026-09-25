"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Loader2, ListPlus, Mic, X } from "lucide-react";
import { searchYoutube, YoutubeSearchOutput } from "@/ai/flows/search-youtube-flow";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { clearRecommendationsCache, updateSearchHistory } from "@/lib/recommendations";
import { Track } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveSearchDialog } from "@/components/save-search-dialog";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const { setQueueAndPlay } = usePlayer();
  const { addTracksToCache } = useUserData();
  const { toast } = useToast();

  const observer = useRef<IntersectionObserver>();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return;

    setIsLoading(true);
    setResults([]);
    setContinuationToken(null);

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
        clearRecommendationsCache();
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

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice search is not supported in your browser.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      handleSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      // 'no-speech' is a normal timeout when the user doesn't say anything
      // We handle it silently to prevent noisy error overlays
      if (event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
          toast({
              variant: "destructive",
              title: "Voice Search Error",
              description: `Error: ${event.error}`,
          });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

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
    setQueueAndPlay(results, trackId, undefined, query, continuationToken);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Search</h1>
        <form onSubmit={onFormSubmit} className="mt-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search for songs, artists, playlists..."
                className="pr-12 text-base h-11"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full text-muted-foreground hover:text-primary transition-colors",
                    isListening && "text-primary"
                )}
                onClick={startVoiceSearch}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            <Button type="submit" size="lg" disabled={isLoading} className="px-6">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
            </Button>
          </div>
        </form>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold font-headline">Results</h2>
          {results.length > 0 && !isLoading && (
            <SaveSearchDialog searchResults={results}>
               <Button variant="outline">
                <ListPlus className="mr-2 h-4 w-4" />
                Save as Playlist
              </Button>
            </SaveSearchDialog>
          )}
        </div>
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

      {/* Voice Search Overlay */}
      <AnimatePresence>
          {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
              >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-6 right-6 h-12 w-12 rounded-full"
                    onClick={() => setIsListening(false)}
                  >
                      <X className="h-6 w-6" />
                  </Button>

                  <div className="flex flex-col items-center gap-12">
                      <div className="relative">
                          {/* Animated Ripples */}
                          <motion.div 
                             className="absolute inset-0 rounded-full bg-primary/20"
                             animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                             transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          />
                          <motion.div 
                             className="absolute inset-0 rounded-full bg-primary/10"
                             animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                             transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                          />
                          
                          <div className="relative h-32 w-32 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.3)]">
                              <Mic className="h-12 w-12 text-primary-foreground fill-primary-foreground" />
                          </div>
                      </div>

                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold font-headline">Listening...</h2>
                        <p className="text-muted-foreground text-lg italic">"Try saying a song or artist name"</p>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
