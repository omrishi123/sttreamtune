
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { searchYoutube, YoutubeSearchOutput } from "@/ai/flows/search-youtube-flow";
import { usePlayer } from "@/context/player-context";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";

const MAX_SEARCH_HISTORY = 5;

// Helper to update search history in localStorage
const updateSearchHistory = (query: string) => {
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const updatedHistory = [query, ...history.filter((item: string) => item !== query)].slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to update search history:", error);
    }
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setQueueAndPlay } = usePlayer();
  const { addTracksToCache } = useUserData();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setResults([]);
    try {
      const searchResults = await searchYoutube({ query });
      addTracksToCache(searchResults);
      setResults(searchResults);
       if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      } else {
        // Add successful search to history
        updateSearchHistory(query);
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

  const handlePlayTrack = (trackId: string) => {
    setQueueAndPlay(results, trackId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Search</h1>
        <form onSubmit={handleSearch} className="mt-4">
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
