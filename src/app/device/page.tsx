
"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone } from "lucide-react";
import { Playlist, Track } from "@/lib/types";
import { TrackList } from '@/components/track-list';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/player-context';

// Extend the window type to include our optional AndroidBridge and the new callback
declare global {
  interface Window {
    Android?: {
      getLocalTracks: () => void;
    };
    updateLocalTracks?: (jsonString: string) => void;
  }
}

export default function DevicePage() {
    const [localTracks, setLocalTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(!!window.Android?.getLocalTracks);

        window.updateLocalTracks = (jsonString: string) => {
            try {
                const tracks = JSON.parse(jsonString);
                const formattedTracks: Track[] = tracks.map((t: any) => ({
                    id: t.uri, // Use URI as a unique ID for local files
                    youtubeVideoId: '', // Not a youtube video
                    title: t.title || 'Unknown Title',
                    artist: t.artist || 'Unknown Artist',
                    album: t.album || 'Unknown Album',
                    artwork: t.artwork || 'https://i.postimg.cc/SswWC87w/streamtune.png',
                    duration: Math.floor(t.duration / 1000), // Convert ms to seconds
                    isLocal: true,
                }));
                setLocalTracks(formattedTracks);
            } catch (error) {
                console.error("Failed to parse local tracks:", error);
            }
            setIsLoading(false);
        };
        
        if (window.Android?.getLocalTracks) {
            window.Android.getLocalTracks();
        } else {
            setIsLoading(false);
        }

        return () => {
            delete window.updateLocalTracks;
        }
    }, []);
    
    const localFilesPlaylist: Playlist = {
        id: "local-files",
        name: "Music on this device",
        description: "All local audio files found on your device",
        owner: "You",
        public: false,
        trackIds: localTracks.map(t => t.id),
        tracks: localTracks,
        coverArt: "https://placehold.co/300x300.png",
        'data-ai-hint': 'smartphone music'
    };
    
    const renderContent = () => {
        if (!isNative) {
            return (
                <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg mt-6">
                    <Smartphone className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Local Playback Not Available</h3>
                    <p className="mt-2 max-w-md mx-auto">This feature is only available in the StreamTune Android app. Install the app to play music directly from your device.</p>
                </div>
            );
        }

        if (isLoading) {
            return <div className="mt-6 space-y-2">
                {Array.from({length: 10}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>;
        }

        if (localTracks.length === 0) {
            return (
                <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg mt-6">
                    <h3 className="text-lg font-semibold text-foreground">No Music Found</h3>
                    <p>We couldn't find any music files on your device.</p>
                </div>
            );
        }
        
        return (
            <div className="mt-6">
                <TrackList tracks={localTracks} playlist={localFilesPlaylist} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    On Your Device
                </h1>
                <p className="text-muted-foreground mt-2">
                    Music stored locally on this device.
                </p>
            </div>
            
            <section>
                {renderContent()}
            </section>
        </div>
    );
}
