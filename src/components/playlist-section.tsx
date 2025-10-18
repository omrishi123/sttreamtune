
"use client";

import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaylistCard } from '@/components/playlist-card';
import type { Playlist } from '@/lib/types';
import { getYoutubePlaylists } from '@/ai/flows/get-youtube-playlists-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { getCachedRecommendedPlaylists, cacheRecommendedPlaylists } from '@/lib/recommendations';

interface PlaylistSectionProps {
  title: string;
  playlists?: Playlist[] | null;
  viewAllLink?: string;
  isPersonalized?: boolean;
}

export const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  title,
  playlists: initialPlaylists,
  viewAllLink,
  isPersonalized = false,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[] | null | undefined>(
    initialPlaylists
  );
  const [isLoading, setIsLoading] = useState(isPersonalized);

  useEffect(() => {
    if (isPersonalized) {
      const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
          const cachedPlaylists = getCachedRecommendedPlaylists(title);
          if (cachedPlaylists) {
            setPlaylists(cachedPlaylists);
          } else {
            const results = await getYoutubePlaylists({ query: `${title} music playlist` });
            setPlaylists(results);
            cacheRecommendedPlaylists(title, results);
          }
        } catch (error) {
          console.error(`Failed to fetch playlists for ${title}:`, error);
          setPlaylists([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlaylists();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonalized, title]);

  if (!isPersonalized && (!playlists || playlists.length === 0)) {
    return null;
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {viewAllLink && (
          <Button asChild variant="ghost" size="sm">
            <Link href={viewAllLink}>
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {isLoading ? (
            Array.from({length: 6}).map((_, i) => (
                <div key={i}>
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
            ))
        ) : playlists && playlists.length > 0 ? (
          playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))
        ) : (
            !isLoading && <p className="col-span-full text-muted-foreground">No playlists found for {title}.</p>
        )}
      </div>
    </section>
  );
};
