

"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Filter, ChevronRight, RefreshCw } from "lucide-react";
import { useUserData } from '@/context/user-data-context';
import type { Playlist, Track, UserMusicProfile } from '@/lib/types';
import { generateRecommendations } from '@/ai/flows/generate-recommendations-flow';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getUserPreferences, clearUserPreferences } from '@/lib/preferences';
import { PlaylistSection } from '@/components/playlist-section';
import { artists as allArtists } from '@/lib/artists';
import { useRouter } from 'next/navigation';
import { getSearchHistory, clearAIGenrePlaylistsCache, clearRecommendationsCache } from '@/lib/recommendations';
import { genres as allGenres } from '@/lib/genres';
import { useToast } from '@/hooks/use-toast';


// Define the virtual playlist for the home page recommendations
const homeRecommendedPlaylist: Playlist = {
    id: 'recommended-for-you',
    name: 'Recommended For You',
    description: "An endless feed of music based on your listening habits.",
    owner: "StreamTune AI",
    public: false,
    trackIds: [],
    coverArt: 'https://i.postimg.cc/mkvv8tmp/digital-art-music-player-with-colorful-notes-black-background-900370-14342.avif',
    'data-ai-hint': 'infinite galaxy',
};


// #region Client-Side Profile Generation
const getWeightedArtists = (recentlyPlayed: Track[]): string[] => {
    if (recentlyPlayed.length === 0) return [];
    const scores: Record<string, number> = {};
    const now = Date.now();

    recentlyPlayed.forEach(track => {
        if (!track.artist || track.artist === 'Unknown Artist' || !track.playedAt) return;

        const ageHours = (now - track.playedAt) / 36e5;
        const weight = Math.exp(-ageHours / 48); // Decay factor over ~2 days

        scores[track.artist] = (scores[track.artist] || 0) + weight;
    });

    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) // Top 3 weighted artists
        .map(([artist]) => artist);
};

const extractKeywords = (searches: string[]): string[] => {
    const blacklist = ['song', 'music', 'video', 'official', 'lyrics', 'audio', 'hd'];
    const words: Record<string, number> = {};

    searches.forEach(q => {
        q.toLowerCase().split(/\s+/).forEach(w => {
            if (w.length < 3 || blacklist.includes(w) || !isNaN(Number(w))) return;
            words[w] = (words[w] || 0) + 1;
        });
    });

    return Object.entries(words)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5 keywords
        .map(([w]) => w);
};

const getPlaylistDna = (userPlaylists: Playlist[], communityPlaylists: Playlist[]): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    if (userTrackIds.size === 0) return [];

    const dnaMatches: { query: string; score: number }[] = [];

    communityPlaylists.forEach(publicPlaylist => {
        if (publicPlaylist.trackIds.length === 0) return;
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        const overlapPercentage = matchCount / publicPlaylist.trackIds.length;
        
        if (overlapPercentage > 0.1) { // Require at least 10% overlap
            // Use playlist name as a potential query
            dnaMatches.push({ query: publicPlaylist.name, score: overlapPercentage });
        }
    });

    return dnaMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) // Top 3 DNA matches
        .map(match => match.query);
};

const buildUserMusicProfile = (
    recentlyPlayed: Track[],
    searchHistory: string[],
    userPlaylists: Playlist[],
    communityPlaylists: Playlist[]
): UserMusicProfile => {
    const topArtists = getWeightedArtists(recentlyPlayed);
    const topKeywords = extractKeywords(searchHistory);
    const playlistDna = getPlaylistDna(userPlaylists, communityPlaylists);
    
    // For now, dominantGenres can be simple. We can enhance this later.
    const dominantGenres = [...new Set([...topKeywords, ...playlistDna])];

    return {
        topArtists,
        topKeywords,
        dominantGenres,
        energyLevel: 'normal', // Placeholder, can be developed later
        freshnessBias: 0.5,    // Placeholder
    };
};
// #endregion


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();
  const { communityPlaylists, recentlyPlayed, playlists: userPlaylists, getTrackById, addTracksToCache, likedSongs } = useUserData();
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    try {
        const recentTracks = recentlyPlayed.map(id => getTrackById(id)).filter(Boolean) as Track[];
        const searchHistory = getSearchHistory();
        
        const profile = buildUserMusicProfile(recentTracks, searchHistory, userPlaylists, communityPlaylists);

        // Build Multi-Query Strategy
        const queries: string[] = [];
        if (profile.topArtists.length > 0) {
            queries.push(`${profile.topArtists[0]} songs`);
            if (profile.topKeywords.length > 0) {
                 queries.push(`${profile.topArtists[0]} ${profile.topKeywords[0]} music`);
            }
        }
        profile.topKeywords.forEach(kw => queries.push(`${kw} aesthetic music`));
        profile.dominantGenres.forEach(g => queries.push(`${g} playlist`));
        
        const uniqueQueries = [...new Set(queries)];

        const { tracks } = await generateRecommendations({
            profile,
            queries: uniqueQueries,
            userHistory: {
                recentlyPlayedIds: recentlyPlayed,
                likedSongIds: likedSongs,
            },
        });
        
        addTracksToCache(tracks);
        setRecommendedTracks(tracks);
    } catch (e) {
        console.error("Failed to fetch recommendations:", e);
    } finally {
        setLoadingRecommendations(false);
    }
  }, [recentlyPlayed, userPlaylists, communityPlaylists, addTracksToCache, getTrackById, likedSongs]);

  useEffect(() => {
      fetchRecommendations();
      const preferences = getUserPreferences();
      if (preferences && preferences.genres) {
        setUserGenres(preferences.genres);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshRecommendations = () => {
    toast({
      title: "Refreshing Your Vibe...",
      description: "Fetching a new set of recommendations based on your latest activity.",
    });
    fetchRecommendations();
  }
  
  const handleResetGenreRecs = () => {
    clearAIGenrePlaylistsCache();
    toast({
        title: "Genre Playlists Reset",
        description: "Your genre-based playlists on the home page will be refreshed.",
    });
  }

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
  }, [recommendedTracks.length, featuredPlaylists.length, recentCommunityPlaylists.length, userGenres]);

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
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleRefreshRecommendations}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh Recommendations</span>
              </DropdownMenuItem>
               <DropdownMenuItem onSelect={handleResetGenreRecs}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Reset Genre Playlists</span>
              </DropdownMenuItem>
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
