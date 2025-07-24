

"use client";

import Image from "next/image";
import { getTracksForPlaylist, getYoutubePlaylistDetails } from "@/ai/flows/get-youtube-playlists-flow";
import { notFound } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import type { Playlist, Track } from "@/lib/types";
import { useUserData } from "@/context/user-data-context";
import React, { useEffect, useState } from "react";
import { usePlayer } from "@/context/player-context";
import { Skeleton } from "@/components/ui/skeleton";

const FALLBACK_IMAGE_URL = "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { getPlaylistById, getTrackById } = useUserData();
  const { setQueueAndPlay } = usePlayer();
  
  const [playlist, setPlaylist] = useState<Playlist | undefined | null>(undefined);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      setIsLoading(true);
      let foundPlaylist: Playlist | undefined | null;

      // Check user-created playlists, liked songs, or recently played first
      if (id.startsWith('playlist-') || id === 'liked-songs' || id === 'recently-played') {
        foundPlaylist = getPlaylistById(id);
      } else {
        // Otherwise, assume it's a YouTube playlist
        try {
          foundPlaylist = await getYoutubePlaylistDetails({ playlistId: id });
        } catch (error) {
           console.error("Failed to fetch from youtube", error)
           foundPlaylist = null;
        }
      }
      
      if (foundPlaylist) {
        setPlaylist(foundPlaylist);
        setImgSrc(foundPlaylist.coverArt);
        // If it's a local playlist (user-created, liked, recently played)
        if (id.startsWith('playlist-') || id === 'liked-songs' || id === 'recently-played') {
            const playlistTracks = foundPlaylist.trackIds.map(trackId => getTrackById(trackId)).filter(Boolean) as Track[];
            setTracks(playlistTracks);
        } else {
            // It's a youtube playlist, fetch tracks for it from the API
            const youtubeTracks = await getTracksForPlaylist(id);
            setTracks(youtubeTracks);
        }

      } else {
        setPlaylist(null); // Not found
      }
      setIsLoading(false);
    };

    fetchPlaylistData();
  }, [id, getPlaylistById, getTrackById]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="w-[200px] h-[200px] rounded-lg shadow-lg" />
          <div className="space-y-3 text-center md:text-left">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-14 w-80" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-32 mt-4" />
          </div>
        </header>
        <section>
          <div className="space-y-2">
            {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </section>
      </div>
    );
  }

  if (!playlist) {
    notFound();
  }
  
  const totalDuration = tracks.reduce((acc, track) => acc + track.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayPlaylist = () => {
    if(tracks.length > 0) {
      setQueueAndPlay(tracks, tracks[0].id, playlist);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row items-center gap-8">
        <Image
          src={imgSrc || playlist.coverArt}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg shadow-lg aspect-square object-cover"
          priority
          data-ai-hint={playlist['data-ai-hint']}
          onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
        />
        <div className="space-y-3 text-center md:text-left">
          <p className="text-sm font-semibold">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">
            {playlist.name}
          </h1>
          <p className="text-muted-foreground">{playlist.description}</p>
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <span className="text-foreground font-medium">{playlist.owner}</span>
            {" \u2022 "}
            {tracks.length} songs, about {totalMinutes} min
          </p>
          <Button size="lg" className="mt-4" onClick={handlePlayPlaylist}>
            <Play className="mr-2 h-5 w-5"/>
            Play
          </Button>
        </div>
      </header>

      <section>
        <TrackList tracks={tracks} playlist={playlist} />
      </section>
    </div>
  );
}
