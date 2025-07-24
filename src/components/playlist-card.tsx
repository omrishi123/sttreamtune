import Link from "next/link";
import Image from "next/image";
import type { Playlist } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/playlists/${playlist.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:bg-card/90 h-full flex flex-col">
        <CardContent className="p-0">
          <Image
            src={playlist.coverArt}
            alt={playlist.name}
            width={300}
            height={300}
            className="aspect-square object-cover transition-transform group-hover:scale-105"
            data-ai-hint={playlist['data-ai-hint']}
          />
        </CardContent>
        <CardHeader className="p-4 flex-1">
          <CardTitle className="text-base font-semibold truncate group-hover:text-primary">
            {playlist.name}
          </CardTitle>
          <CardDescription className="text-xs truncate">
            By {playlist.owner}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
