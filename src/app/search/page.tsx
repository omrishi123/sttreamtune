
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { searchYoutube, YoutubeSearchOutput } from "@/ai/flows/search-youtube-flow";
import { usePlayer } from "@/context/player-context";
import { Track } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setQueue, currentTrack, isPlaying, play, pause } = usePlayer();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    try {
      const searchResults = await searchYoutube({ query });
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      // You might want to show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
        if(isPlaying) pause();
        else play();
    } else {
        setQueue([track], track.id);
    }
  }

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
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            {results.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <Image
                  src={track.artwork}
                  alt={track.title}
                  width={48}
                  height={48}
                  className="rounded-md"
                  data-ai-hint={track['data-ai-hint']}
                />
                <div className="flex-1">
                  <p className="font-semibold">{track.title}</p>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => handlePlayTrack(track)}>
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
