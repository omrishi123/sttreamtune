
"use client";

import { useUserData } from "@/context/user-data-context";
import { usePlayer } from "@/context/player-context";
import { useEffect, useState } from "react";

export function AppInitializer() {
  const { addRecentlyPlayed, addTrackToCache } = useUserData();
  const { currentTrack } = usePlayer();
  const [lastPlayedTrackId, setLastPlayedTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastPlayedTrackId) {
      addTrackToCache(currentTrack);
      addRecentlyPlayed(currentTrack.id);
      setLastPlayedTrackId(currentTrack.id);
    }
  }, [currentTrack, addRecentlyPlayed, addTrackToCache, lastPlayedTrackId]);

  return null; // This component does not render anything
}
