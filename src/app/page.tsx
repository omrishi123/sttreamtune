"use client";

import React from 'react';
import type { YoutubePlaylistsOutput } from '@/ai/flows/get-youtube-playlists-flow';
import { PlaylistCard } from '@/components/playlist-card';
import { homePagePlaylists } from "@/lib/mock-data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PlaylistSectionProps {
  title: string;
  playlists: YoutubePlaylistsOutput | null;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists }) => (
  <section>
    <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {playlists?.map((playlist) => (
          <CarouselItem key={playlist.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
            <div className="h-full">
              <PlaylistCard playlist={playlist} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  </section>
);


export default function HomePage() {
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
      
      {homePagePlaylists.map(section => (
         <PlaylistSection 
            key={section.title}
            title={section.title} 
            playlists={section.playlists}
          />
      ))}
     
    </div>
  );
}
