"use client";

import React, { useState, useEffect } from 'react';
import {
  getYoutubePlaylists,
  YoutubePlaylistsOutput,
} from '@/ai/flows/get-youtube-playlists-flow';
import { PlaylistCard } from '@/components/playlist-card';
import { Skeleton } from '@/components/ui/skeleton';

interface PlaylistSectionProps {
  title: string;
  playlists: YoutubePlaylistsOutput | null;
  isLoading: boolean;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, isLoading }) => (
  <section>
    <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
    {isLoading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-[150px] w-[150px] rounded-lg" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {playlists?.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    )}
  </section>
);


export default function HomePage() {
  const [hindiPlaylists, setHindiPlaylists] = useState<YoutubePlaylistsOutput | null>(null);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<YoutubePlaylistsOutput | null>(null);
  const [loadingHindi, setLoadingHindi] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoadingHindi(true);
        const hindiResults = await getYoutubePlaylists({ query: 'Top Hindi Songs' });
        setHindiPlaylists(hindiResults);
      } catch (error) {
        console.error('Failed to fetch hindi playlists:', error);
      } finally {
        setLoadingHindi(false);
      }
      
      try {
        setLoadingFeatured(true);
        const featuredResults = await getYoutubePlaylists({ query: 'Billboard Hot 100' });
        setFeaturedPlaylists(featuredResults);
      } catch (error) {
        console.error('Failed to fetch featured playlists:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          Listen Now
        </h1>
        <p className="text-muted-foreground mt-2">
          Top picks for you. Updated daily.
        </p>
      </div>
      
      <PlaylistSection 
        title="Best of Bollywood" 
        playlists={hindiPlaylists}
        isLoading={loadingHindi}
      />
      
      <PlaylistSection 
        title="Featured Playlists" 
        playlists={featuredPlaylists}
        isLoading={loadingFeatured}
      />
    </div>
  );
}
