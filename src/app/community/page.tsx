
"use client";

import React from 'react';
import { PlaylistCard } from '@/components/playlist-card';
import { useUserData } from '@/context/user-data-context';

export default function CommunityPage() {
  const { communityPlaylists } = useUserData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          Community Playlists
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover playlists created by the StreamTune community.
        </p>
      </div>
      
      <section>
        {communityPlaylists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
            {communityPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">Nothing to see here... yet!</h2>
            <p className="text-muted-foreground mt-2">
              Be the first to create a public playlist to share with the community.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
