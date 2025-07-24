import Image from "next/image";
import { getPlaylistById, getTracksForPlaylist } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const playlist = getPlaylistById(params.id);
  
  if (!playlist) {
    notFound();
  }

  const tracks = getTracksForPlaylist(params.id);
  const totalDuration = tracks.reduce((acc, track) => acc + track.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row items-center gap-8">
        <Image
          src={playlist.coverArt}
          alt={playlist.name}
          width={200}
          height={200}
          className="rounded-lg shadow-lg aspect-square object-cover"
          priority
          data-ai-hint={playlist['data-ai-hint']}
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
          <Button size="lg" className="mt-4">
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
