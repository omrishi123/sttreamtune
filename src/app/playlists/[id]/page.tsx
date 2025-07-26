

"use client";

import Image from "next/image";
import { getTracksForPlaylist, getYoutubePlaylistDetails } from "@/ai/flows/get-youtube-playlists-flow";
import { notFound, useParams, useRouter } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play, Share2 } from "lucide-react";
import type { Playlist, Track } from "@/lib/types";
import { useUserData } from "@/context/user-data-context";
import React, { useEffect, useState } from "react";
import { usePlayer } from "@/context/player-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_IMAGE_URL = "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg";

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  const { getPlaylistById, getTrackById, addTracksToCache } = useUserData();
  const { setQueueAndPlay } = usePlayer();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | undefined | null>(undefined);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!id) return;
      setIsLoading(true);
      let foundPlaylist: Playlist | undefined | null;

      // Check user-created playlists, liked songs, or recently played first
      if (id.startsWith('playlist-') || id === 'liked-songs' || id === 'recently-played' || id.startsWith('pl-ai-')) {
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
        // If it's a local playlist (user-created, liked, recently played, AI)
        if (id.startsWith('playlist-') || id === 'liked-songs' || id === 'recently-played' || id.startsWith('pl-ai-')) {
            const playlistTracks = foundPlaylist.trackIds.map(trackId => getTrackById(trackId)).filter(Boolean) as Track[];
            setTracks(playlistTracks);
        } else {
            // It's a youtube playlist, fetch tracks for it from the API
            const youtubeTracks = await getTracksForPlaylist(id);
            addTracksToCache(youtubeTracks);
            setTracks(youtubeTracks);
        }

      } else {
        setPlaylist(null); // Not found
      }
      setIsLoading(false);
    };

    fetchPlaylistData();
  }, [id, getPlaylistById, getTrackById, addTracksToCache]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-lg shadow-lg flex-shrink-0" />
          <div className="space-y-3 text-center sm:text-left w-full">
            <Skeleton className="h-4 w-24 mx-auto sm:mx-0" />
            <Skeleton className="h-10 w-60 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-full max-w-sm mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-12 w-32 mt-4 mx-auto sm:mx-0" />
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
  
  const totalDuration = tracks.reduce((acc, track) => acc + (track?.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayPlaylist = () => {
    if(tracks.length > 0) {
      setQueueAndPlay(tracks, tracks[0].id, playlist);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Playlist link has been copied to your clipboard.",
    });
  }

  return (
    <div className="space-y-8">
       <header className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <Image
          src={imgSrc || playlist.coverArt}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg shadow-lg aspect-square object-cover w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] flex-shrink-0"
          priority
          data-ai-hint={playlist['data-ai-hint']}
          onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
        />
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider">Playlist</p>
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter break-words">
            {playlist.name}
          </h1>
          {playlist.description && <p className="text-muted-foreground text-sm">{playlist.description}</p>}
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <span className="text-foreground font-medium">{playlist.owner}</span>
            {" \u2022 "}
            {tracks.length} songs, about {totalMinutes} min
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
             <Button size="lg" onClick={handlePlayPlaylist}>
                <Play className="mr-2 h-5 w-5"/>
                Play
             </Button>
             <Button size="lg" variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-5 w-5"/>
                Share
             </Button>
          </div>
        </div>
      </header>

      <section>
        <TrackList tracks={tracks} playlist={playlist} />
      </section>
    </div>
  );
}
