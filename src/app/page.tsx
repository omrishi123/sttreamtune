"use client";

import React, { useState, useEffect } from 'react';
import {
  YoutubePlaylistsOutput,
} from '@/ai/flows/get-youtube-playlists-flow';
import { PlaylistCard } from '@/components/playlist-card';
import { homePagePlaylists } from "@/lib/mock-data";

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
