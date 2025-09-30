
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { searchYoutube, YoutubeSearchOutput } from "@/ai/flows/search-youtube-flow";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { clearAllRecommendationCaches, updateSearchHistory } from "@/lib/recommendations";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<YoutubeSearchOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setQueueAndPlay } = usePlayer();
  const { addTracksToCache } = useUserData();
  const { toast } = useToast();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return;

    setIsLoading(true);
    setResults([]);
    try {
      const searchResults = await searchYoutube({ query: searchQuery });
      addTracksToCache(searchResults);
      setResults(searchResults);
       if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      } else {
        // On successful search, update history and clear old recommendations
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
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            {results.map((track) => (
              <div
                key={track.id}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
