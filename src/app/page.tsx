
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
import { Filter, ChevronRight } from "lucide-react";
import { useUserData } from '@/context/user-data-context';
import type { Playlist, Track } from '@/lib/types';
import { getCachedRecommendations } from '@/lib/recommendations';
import { TrackCard } from '@/components/track-card';


interface PlaylistSectionProps {
  title: string;
  playlists: Playlist[] | null;
  viewAllLink?: string;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({ title, playlists, viewAllLink }) => (
  <section>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold font-headline">{title}</h2>
      {viewAllLink && (
        <Button asChild variant="ghost" size="sm">
          <Link href={viewAllLink}>
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {playlists?.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  </section>
);


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { communityPlaylists } = useUserData();
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);

  useEffect(() => {
      const fetchRecommendations = async () => {
          const { tracks } = await getCachedRecommendations();
          setRecommendedTracks(tracks);
      };
      fetchRecommendations();
  }, []);

  const featuredPlaylists = useMemo(() => {
    return communityPlaylists.filter(p => p.isFeatured);
  }, [communityPlaylists]);

  const recentCommunityPlaylists = useMemo(() => {
    // Exclude featured playlists from the "recent" section to avoid duplication
    return communityPlaylists.filter(p => !p.isFeatured).slice(0, 6);
  }, [communityPlaylists]);


  const categories = useMemo(() => {
    const allCategories = ['All'];
    homePagePlaylists.forEach(section => {
      if (!allCategories.includes(section.title)) {
        allCategories.push(section.title);
      }
    });
    return allCategories;
  }, []);

  const filteredPlaylists = useMemo(() => {
    if (selectedCategory === 'All') {
      return homePagePlaylists;
    }
    return homePagePlaylists.filter(section => section.title === selectedCategory);
  }, [selectedCategory]);

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

      {recommendedTracks.length > 0 && (
          <section>
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold font-headline">Recommended For You</h2>
                  <Button asChild variant="ghost" size="sm">
                      <Link href="/recommended">
                          View all
                          <ChevronRight className="h-4 w-4" />
                      </Link>
                  </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {recommendedTracks.slice(0, 3).map(track => (
                    <TrackCard key={track.id} track={track} tracklist={recommendedTracks} />
                ))}
              </div>
          </section>
      )}
      
      {featuredPlaylists.length > 0 && (
         <PlaylistSection 
            title="Featured Playlists" 
            playlists={featuredPlaylists}
            viewAllLink="/community"
          />
      )}

      {recentCommunityPlaylists.length > 0 && (
         <PlaylistSection 
            title="Community Playlists" 
            playlists={recentCommunityPlaylists}
            viewAllLink="/community"
          />
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
