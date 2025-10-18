
'use server';
/**
 * @fileOverview An API-free, personalized song recommender.
 *
 * This flow generates recommendations based on two main strategies:
 * 1.  **Artist Affinity**: Finds the user's most played artists and searches for more of their content.
 * 2.  **Playlist DNA**: Finds community playlists that share tracks with the user's private playlists and recommends songs from them.
 *
 * It uses the direct YouTube scraping search flow and supports pagination for infinite scrolling.
 */

import { z } from 'zod';
import { searchYoutube, YoutubeSearchOutput } from './search-youtube-flow';
import type { Playlist, Track } from '@/lib/types';

// Define input for the recommendation flow
const GenerateRecommendationsInputSchema = z.object({
  recentlyPlayed: z.array(z.custom<Track>()).describe('A list of the user\'s recently played tracks with full metadata.'),
  userPlaylists: z.array(z.custom<Playlist>()).describe('A list of the user\'s private playlists.'),
  communityPlaylists: z.array(z.custom<Playlist>()).describe('A list of all public community playlists.'),
  continuationToken: z.string().optional().describe('The token for fetching the next page of results.'),
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

// Define the output, which matches the YouTube search output for consistency
export type GenerateRecommendationsOutput = YoutubeSearchOutput;


// Helper to find the most frequent artists from the user's listening history
const getTopArtists = (recentlyPlayed: Track[], count: number): string[] => {
  if (!recentlyPlayed.length) return [];
  const artistCounts: { [artist: string]: number } = {};
  recentlyPlayed.forEach(track => {
    if (track.artist !== 'Unknown Artist') {
        artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
    }
  });
  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
};

// Helper to find queries based on shared songs between user and community playlists
const getPlaylistDnaQueries = (userPlaylists: Playlist[], communityPlaylists: Playlist[], count: number): string[] => {
    if (!userPlaylists.length || !communityPlaylists.length) return [];
    
    const userTrackIds = new Set(userPlaylists.flatMap(p => p.trackIds));
    const dnaMatches: { query: string; score: number }[] = [];

    communityPlaylists.forEach(publicPlaylist => {
        const matchCount = publicPlaylist.trackIds.filter(tid => userTrackIds.has(tid)).length;
        if (matchCount > 0) {
            // We use the public playlist name as a search query, weighted by how many songs it shares with the user's playlists.
            dnaMatches.push({ query: publicPlaylist.name, score: matchCount });
        }
    });

    return dnaMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(match => match.query);
};


export async function generateRecommendations(input: GenerateRecommendationsInput): Promise<GenerateRecommendationsOutput> {
    
  // If a continuation token is provided, it means we are just fetching the next page of a previous search.
  // The query for that search is embedded within the token by YouTube, so we don't need the other inputs.
  if (input.continuationToken) {
    try {
      const moreResults = await searchYoutube({ query: '', continuationToken: input.continuationToken });
      return moreResults;
    } catch (error) {
      console.error("Failed to fetch more recommendations:", error);
      return { tracks: [], nextContinuationToken: null };
    }
  }

  // --- If it's a new recommendation request (no token) ---

  // 1. Generate a list of search queries based on user's habits
  const topArtists = getTopArtists(input.recentlyPlayed, 2); // Get top 2 artists
  const dnaQueries = getPlaylistDnaQueries(input.userPlaylists, input.communityPlaylists, 2); // Get top 2 playlist DNA queries

  const searchQueries = [...topArtists, ...dnaQueries];

  // If there's absolutely no history or playlists to go on, we can't generate recommendations.
  if (searchQueries.length === 0) {
    return { tracks: [], nextContinuationToken: null };
  }

  // 2. Combine queries into a single, powerful search string.
  // This tells YouTube to find content related to all these items.
  const combinedQuery = searchQueries.join(' | '); // The "|" acts like an "OR" in search

  // 3. Perform the initial search
  try {
    const initialResults = await searchYoutube({ query: combinedQuery });

    // Remove any tracks that the user has recently played to keep recommendations fresh.
    const recentIds = new Set(input.recentlyPlayed.map(t => t.id));
    const freshTracks = initialResults.tracks.filter(t => !recentIds.has(t.id));

    return {
        tracks: freshTracks,
        nextContinuationToken: initialResults.nextContinuationToken,
    };
  } catch (error) {
    console.error("Failed to fetch initial recommendations:", error);
    return { tracks: [], nextContinuationToken: null };
  }
}
