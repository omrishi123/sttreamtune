
"use client";

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
import { useState } from "react";

interface PlaylistCardProps {
  playlist: Playlist;
}

const FALLBACK_IMAGE_URL = "https://c.saavncdn.com/237/Top-10-Sad-Songs-Hindi-Hindi-2021-20250124193408-500x500.jpg";


export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const [imgSrc, setImgSrc] = useState(playlist.coverArt || "https://placehold.co/300x300.png");

  return (
    <Link href={`/playlists/${playlist.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:bg-card/90 h-full flex flex-col">
        <CardContent className="p-0">
          <Image
            src={imgSrc}
            alt={playlist.name}
            width={300}
            height={300}
            className="aspect-square object-cover transition-transform group-hover:scale-105"
            data-ai-hint={playlist['data-ai-hint']}
            onError={() => setImgSrc(FALLBACK_IMAGE_URL)}
          />
        </CardContent>
        <CardHeader className="p-3 flex-1">
          <CardTitle className="text-sm font-semibold truncate group-hover:text-primary leading-tight">
            {playlist.name}
          </CardTitle>
          {playlist.owner && <CardDescription className="text-xs truncate mt-1">
            By {playlist.owner}
          </CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}
