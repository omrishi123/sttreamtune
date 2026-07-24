
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
import { Icons } from "./icons";
import { DEFAULT_PLAYLIST_COVER, APP_LOGO_URL } from "@/lib/constants";

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
  const [imgSrc, setImgSrc] = useState(playlist.coverArt || APP_LOGO_URL);

  useEffect(() => {
    setImgSrc(playlist.coverArt || APP_LOGO_URL);
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
              onError={() => setImgSrc(DEFAULT_PLAYLIST_COVER)}
              unoptimized
            />
          </CardContent>
          <CardHeader className="p-2 sm:p-3 flex-1">
            <CardTitle className="text-xs sm:text-sm font-semibold truncate group-hover:text-primary leading-tight">
              {playlist.name}
            </CardTitle>
            {playlist.owner && (
              <CardDescription className="text-[10px] sm:text-xs truncate mt-1 flex items-center gap-1">
                By {playlist.owner}
                {playlist.ownerIsVerified && <Icons.verified className="h-3 w-3 text-blue-500" />}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  );
}
