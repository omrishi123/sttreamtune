
"use client";

import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useUserData } from "@/context/user-data-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { Channel } from "@/lib/types";
import { TrackList } from "@/components/track-list";
import { PlaylistCard } from "@/components/playlist-card";

export default function ChannelPage() {
  const params = useParams();
  const id = params.id as string;
  const { getChannelById } = useUserData();
  
  const [channel, setChannel] = useState<Channel | undefined | null>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundChannel = getChannelById(id);
      setChannel(foundChannel);
      setIsLoading(false);
    }
  }, [id, getChannelById]);

  if (isLoading) {
    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-full shadow-lg flex-shrink-0" />
                <div className="space-y-3 text-center sm:text-left w-full">
                    <Skeleton className="h-10 w-60 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
                </div>
            </header>
            <section>
                 <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-2">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </section>
        </div>
    );
  }

  if (!channel) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <Image
          src={channel.logo}
          alt={channel.name}
          width={200}
          height={200}
          className="rounded-full shadow-lg aspect-square object-cover w-[150px] h-[150px] sm:w-[175px] sm:h-[175px] md:w-[200px] md:h-[200px] flex-shrink-0"
          priority
          unoptimized
        />
        <div className="space-y-3 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider">Channel</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tighter line-clamp-3">
            {channel.name}
          </h1>
        </div>
      </header>

      {channel.uploads.length > 0 && (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Uploads</h2>
            <TrackList tracks={channel.uploads} />
        </section>
      )}

      {channel.playlists.length > 0 && (
         <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {channel.playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
            </div>
        </section>
      )}
    </div>
  );
}
