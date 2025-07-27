
"use client";

import React, { useState, useMemo } from 'react';
import type { YoutubePlaylistsOutput } from '@/ai/flows/get-youtube-playlists-flow';
import { PlaylistCard } from '@/components/playlist-card';
import { homePagePlaylists } from "@/lib/mock-data";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


interface PlaylistSectionProps {
  title: string;
  playlists: YoutubePlaylistsOutput | null;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists }) => (
  <section>
    <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {playlists?.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  </section>
);


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    return ['All', ...homePagePlaylists.map(section => section.title)];
  }, []);

  const filteredPlaylists = useMemo(() => {
    if (selectedCategory === 'All') {
      return homePagePlaylists;
    }
    return homePagePlaylists.filter(section => section.title === selectedCategory);
  }, [selectedCategory]);

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

      <div className="relative">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2 pb-2">
                {categories.map(category => (
                <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full whitespace-nowrap"
                >
                    {category}
                </Button>
                ))}
            </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {filteredPlaylists.map(section => (
         <PlaylistSection 
            key={section.title}
            title={section.title} 
            playlists={section.playlists}
          />
      ))}
     
    </div>
  );
}
