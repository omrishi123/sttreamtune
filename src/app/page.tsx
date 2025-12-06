
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaylistCard } from '@/components/playlist-card';
import { homePagePlaylists } from "@/lib/mock-data";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ChevronRight, Music } from "lucide-react";
import { useUserData } from '@/context/user-data-context';
import type { Playlist, Track } from '@/lib/types';
import { generateRecommendations } from '@/ai/flows/generate-recommendations-flow';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getUserPreferences } from '@/lib/preferences';
import { PlaylistSection } from '@/components/playlist-section';
import { artists as allArtists } from '@/lib/artists';
import { useRouter } from 'next/navigation';

// Define the virtual playlist for the home page recommendations
const homeRecommendedPlaylist: Playlist = {
    id: 'recommended-for-you',
    name: 'Recommended For You',
    description: "An endless feed of music based on your listening habits.",
    owner: "StreamTune AI",
    public: false,
    trackIds: [], // This will be populated dynamically
    coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
    'data-ai-hint': 'infinite galaxy',
};

// Client-side helpers to generate queries
const getTopArtists = (recentlyPlayed: Track[], count: number): string[] => {
  if (!recentlyPlayed.length) return [];
  const artistCounts: { [artist: string]: number } = {};
  recentlyPlayed.forEach(track => {
    if (track.artist && track.artist !== 'Unknown Artist') {
      artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
    }
  });
  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
};

const getPlaylistDnaQueries = (userPlaylists: Playlist[], communityPlaylists: Playlist[], count: number): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    const dnaMatches: { query: string; score: number }[] = [];

    communityPlaylists.forEach(publicPlaylist => {
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        if (matchCount > 0) {
            dnaMatches.push({ query: publicPlaylist.name, score: matchCount });
        }
    });

    return dnaMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(match => match.query);
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();
  const { communityPlaylists, recentlyPlayed, playlists: userPlaylists, getTrackById, addTracksToCache } = useUserData();
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [userGenres, setUserGenres] = useState<string[]>([]);

  useEffect(() => {
      const fetchRecommendations = async () => {
          setLoadingRecommendations(true);
          const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
          
          if (recentTracks.length > 0 || userPlaylists.length > 0) {
            // Generate the query on the client
            const topArtists = getTopArtists(recentTracks, 2);
            const dnaQueries = getPlaylistDnaQueries(userPlaylists, communityPlaylists, 3);
            const searchQueries = [...new Set([...topArtists, ...dnaQueries])];
            
            if (searchQueries.length > 0) {
                const combinedQuery = searchQueries.join(' | ');

                const { tracks } = await generateRecommendations({
                    query: combinedQuery,
                    userHistory: { recentlyPlayed, userPlaylists },
                });
                addTracksToCache(tracks);
                setRecommendedTracks(tracks);
            }
          }
          setLoadingRecommendations(false);
      };
      fetchRecommendations();

      const preferences = getUserPreferences();
      if (preferences && preferences.genres) {
        setUserGenres(preferences.genres);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featuredPlaylists = useMemo(() => {
    if (!communityPlaylists) return [];
    return communityPlaylists.filter(p => p.isFeatured);
  }, [communityPlaylists]);

  const recentCommunityPlaylists = useMemo(() => {
    if (!communityPlaylists) return [];
    // Exclude featured playlists from the "recent" section to avoid duplication
    return communityPlaylists.filter(p => !p.isFeatured).slice(0, 6);
  }, [communityPlaylists]);


  const categories = useMemo(() => {
    const dynamicCategories = [];
    if (recommendedTracks.length > 0) dynamicCategories.push('Recommended For You');
    if (featuredPlaylists.length > 0) dynamicCategories.push('Featured Playlists');
    if (recentCommunityPlaylists.length > 0) dynamicCategories.push('Community Playlists');
    dynamicCategories.push(...userGenres);
    dynamicCategories.push('Top Artists');

    const staticCategories = homePagePlaylists.map(section => section.title);
    
    return ['All', ...[...new Set([...dynamicCategories, ...staticCategories])]];
  }, [recommendedTracks, featuredPlaylists, recentCommunityPlaylists, userGenres]);

  const filteredPlaylists = useMemo(() => {
    if (selectedCategory === 'All') {
      return homePagePlaylists;
    }
    return homePagePlaylists.filter(section => section.title === selectedCategory);
  }, [selectedCategory]);
  
  const topArtists = useMemo(() => allArtists.slice(0, 6), []);
  
  const handleArtistClick = (artistName: string) => {
    router.push(`/search?q=${encodeURIComponent(artistName)}`);
  };

  const shouldShow = (category: string) => {
    return selectedCategory === 'All' || selectedCategory === category;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            Listen Now
          </h1>
          <p className="text-muted-foreground mt-2">
            Top picks for you. Updated daily.
          </p>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{selectedCategory}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                {categories.map(category => (
                  <DropdownMenuRadioItem key={category} value={category}>
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>

      {shouldShow('Recommended For You') && (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-headline">Recommended For You</h2>
                {recommendedTracks.length > 6 && (
                  <Button asChild variant="ghost" size="sm">
                      <Link href="/recommended">
                          View all
                          <ChevronRight className="h-4 w-4" />
                      </Link>
                  </Button>
                )}
            </div>
            {loadingRecommendations ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
               </div>
            ) : recommendedTracks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                  {recommendedTracks.slice(0, 6).map(track => (
                      <TrackCard 
                        key={track.id} 
                        track={track} 
                        tracklist={recommendedTracks}
                        playlist={homeRecommendedPlaylist}
                      />
                  ))}
                </div>
            ) : (
               <Card className="flex flex-col items-center justify-center p-6 text-center bg-muted/50">
                  <CardContent className="p-0 space-y-3">
                    <h3 className="font-semibold">Nothing to recommend yet!</h3>
                    <p className="text-sm text-muted-foreground">
                      Play some songs to get personalized recommendations.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/search">Go to Search</Link>
                    </Button>
                  </CardContent>
              </Card>
            )}
        </section>
      )}


      {shouldShow('Featured Playlists') && featuredPlaylists.length > 0 && (
         <PlaylistSection 
            title="Featured Playlists" 
            playlists={featuredPlaylists}
            viewAllLink="/community"
          />
      )}
      
      {shouldShow('Community Playlists') && recentCommunityPlaylists.length > 0 && (
         <PlaylistSection 
            title="Community Playlists" 
            playlists={recentCommunityPlaylists}
            viewAllLink="/community"
          />
      )}
      
      {userGenres.map(genre => shouldShow(genre) && (
        <PlaylistSection
            key={genre}
            title={genre}
            isPersonalized={true}
        />
      ))}

      {shouldShow('Top Artists') && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-headline">Top Artists</h2>
             <Button asChild variant="ghost" size="sm">
                <Link href="/artists">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {topArtists.map((artist) => (
                <div
                  key={artist.name}
                  className="group text-center cursor-pointer"
                  onClick={() => handleArtistClick(artist.name)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={artist.imageUrl}
                      alt={artist.name}
                      fill
                      className="object-cover"
                      unoptimized
                      data-ai-hint={`${artist.name} portrait`}
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold truncate transition-colors group-hover:text-primary">
                    {artist.name}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {filteredPlaylists.map(section => (
         <PlaylistSection 
            key={section.title}
            title={section.title} 
            playlists={section.playlists}
          />
      ))}
     
    </div>
  );
}
