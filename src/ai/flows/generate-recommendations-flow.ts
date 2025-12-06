
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
import adminDb from '@/lib/firebase-admin';

// Define input for the recommendation flow - it's just a simple query now
const GenerateRecommendationsInputSchema = z.object({
  query: z.string().describe('A search query combining top artists and playlist DNA.'),
  continuationToken: z.string().optional().describe('The token for fetching the next page of results.'),
  userHistory: z.object({
      recentlyPlayed: z.array(z.string()).describe("A list of the user's recently played track IDs."),
      userPlaylists: z.array(z.custom<Playlist>()).describe("A list of the user's private playlists."),
  }).optional().describe("User's listening history, used only on the server.")
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

// Define the output, which matches the YouTube search output for consistency
export type GenerateRecommendationsOutput = YoutubeSearchOutput;

// Helper to get all public community playlists from Firestore
async function getCommunityPlaylists(): Promise<Playlist[]> {
    if (!adminDb) return [];
    try {
        const snapshot = await adminDb.collection('communityPlaylists').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
    } catch (error) {
        console.error("Failed to fetch community playlists:", error);
        return [];
    }
}

// Helper to find the most frequent artists from the user's listening history
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

// Helper to find queries based on shared songs between user and community playlists
const getPlaylistDnaQueries = async (userPlaylists: Playlist[], count: number): Promise<string[]> => {
    if (!userPlaylists.length) return [];
    
    const communityPlaylists = await getCommunityPlaylists();
    if (!communityPlaylists.length) return [];

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
      // The query can be empty here because the token contains all necessary info for YouTube's backend.
      const moreResults = await searchYoutube({ query: '', continuationToken: input.continuationToken });
      return moreResults;
    } catch (error) {
      console.error("Failed to fetch more recommendations:", error);
      return { tracks: [], nextContinuationToken: null };
    }
  }

  // --- If it's a new recommendation request (no token) ---
  
  // We use the pre-computed query from the client.
  const combinedQuery = input.query;

  // If there's no query, we can't generate recommendations.
  if (!combinedQuery) {
    return { tracks: [], nextContinuationToken: null };
  }
  
  try {
    const initialResults = await searchYoutube({ query: combinedQuery });

    // The user's recently played track IDs are passed from the client to filter out seen tracks.
    const recentIds = new Set(input.userHistory?.recentlyPlayed || []);
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
