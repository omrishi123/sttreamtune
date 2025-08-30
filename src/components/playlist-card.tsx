
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
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const FALLBACK_IMAGE_URL = "https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif";
const PLACEHOLDER_IMAGE_URL = "https://i.postimg.cc/SswWC87w/streamtune.png";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
};

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const [imgSrc, setImgSrc] = useState(playlist.coverArt || PLACEHOLDER_IMAGE_URL);

  useEffect(() => {
    setImgSrc(playlist.coverArt || PLACEHOLDER_IMAGE_URL);
  }, [playlist.coverArt]);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={cardVariants}
    >
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
              unoptimized
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
    </motion.div>
  );
}
