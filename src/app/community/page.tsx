

"use client";

import React from 'react';
import { PlaylistCard } from '@/components/playlist-card';
import { useUserData } from '@/context/user-data-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, Upload, Plus } from 'lucide-react';
import { GeneratePlaylistDialog } from '@/components/generate-playlist-dialog';
import { ImportPlaylistDialog } from '@/components/import-playlist-dialog';
import { AddPlaylistDialog } from '@/components/add-playlist-dialog';
import { Music } from 'lucide-react';

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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
            {communityPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/50 col-span-full">
            <CardContent className="p-0 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-xl">Nothing to see here... yet!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                It looks like no one has shared a public playlist. Be the first to contribute and share your vibe with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-center mt-6">
                 <GeneratePlaylistDialog>
                    <Button variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create with AI
                    </Button>
                </GeneratePlaylistDialog>
                <ImportPlaylistDialog>
                    <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import from YouTube
                    </Button>
                </ImportPlaylistDialog>
                <AddPlaylistDialog>
                    <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        New Playlist
                    </Button>
                </AddPlaylistDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
