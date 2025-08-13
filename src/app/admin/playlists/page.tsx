
'use client';

import { getAllPublicPlaylists } from '@/lib/admin-actions';
import { PlaylistsTable } from './_components/playlists-table';
import React, { useEffect, useState } from 'react';
import type { Playlist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


function PlaylistsPageSkeleton() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Community Playlists</h2>
      <div className="border rounded-lg p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        setLoading(true);
        const fetchedPlaylists = await getAllPublicPlaylists();
        setPlaylists(fetchedPlaylists);
      } catch (err: any) {
        console.error("Failed to fetch playlists:", err);
        setError("Could not load playlists.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylists();
  }, []);
  
  if (loading) {
    return <PlaylistsPageSkeleton />;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Community Playlists</h2>
      <PlaylistsTable initialPlaylists={playlists} />
    </div>
  );
}
