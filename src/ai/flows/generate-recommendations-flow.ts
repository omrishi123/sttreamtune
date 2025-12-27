
'use server';
/**
 * @fileOverview A HYBRID RULE-BASED INTELLIGENT ENGINE for music recommendations.
 * This flow executes a multi-query search strategy based on a user's music profile,
 * then merges, filters, and ranks the results to provide high-quality, fresh recommendations.
 */

import { z } from 'zod';
import { searchYoutube } from './search-youtube-flow';
import type { Track, Playlist, UserMusicProfile } from '@/lib/types';
import { getTrendingSongs } from './get-trending-songs-flow';

const GenerateRecommendationsInputSchema = z.object({
  profile: z.custom<UserMusicProfile>().describe("The user's calculated music profile."),
  queries: z.array(z.string()).describe("An array of smart search queries."),
  userHistory: z.object({
      recentlyPlayedIds: z.array(z.string()),
      likedSongIds: z.array(z.string()),
  }).describe("IDs of songs to exclude from results."),
  continuationToken: z.string().optional().describe('Token for paginating a specific query.'),
  queryToContinue: z.string().optional().describe('The original query string to paginate.')
});
type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

const GenerateRecommendationsOutputSchema = z.object({
    tracks: z.array(z.custom<Track>()),
    nextContinuationToken: z.string().nullable(),
    continuationQuery: z.string().nullable(),
});
export type GenerateRecommendationsOutput = z.infer<typeof GenerateRecommendationsOutputSchema>;


const titleBlacklist = ['karaoke', 'instrumental', 'cover', 'live', 'tutorial', 'lyrics'];

function rankAndFilterTracks(
    tracks: Track[], 
    profile: UserMusicProfile, 
    history: { recentlyPlayedIds: string[], likedSongIds: string[] }
): Track[] {
    const seenIds = new Set<string>([...history.recentlyPlayedIds, ...history.likedSongIds]);
    const uniqueTracks = new Map<string, Track>();

    for (const track of tracks) {
        // Basic filtering
        if (
            seenIds.has(track.id) ||
            track.duration < 60 ||
            titleBlacklist.some(word => track.title.toLowerCase().includes(word))
        ) {
            continue;
        }

        // Scoring
        let score = 0;
        const lowerCaseTitle = track.title.toLowerCase();
        const lowerCaseArtist = track.artist.toLowerCase();

        // Strong match for top artists
        if (profile.topArtists.some(artist => lowerCaseArtist.includes(artist.toLowerCase()))) {
            score += 4;
        }
        // Good match for keywords in title
        if (profile.topKeywords.some(keyword => lowerCaseTitle.includes(keyword.toLowerCase()))) {
            score += 3;
        }
        // Decent match for genre keywords
        if (profile.dominantGenres.some(genre => lowerCaseTitle.includes(genre.toLowerCase()))) {
            score += 2;
        }
        
        // Add a small amount of randomness to break ties
        score += Math.random() * 0.5;

        // Add the track with its score, keeping the one with the highest score if duplicate
        const existing = uniqueTracks.get(track.id);
        if (!existing || score > (existing as any).score) {
            (track as any).score = score;
            uniqueTracks.set(track.id, track);
        }
    }

    const rankedTracks = Array.from(uniqueTracks.values());
    rankedTracks.sort((a, b) => (b as any).score - (a as any).score);
    
    return rankedTracks;
}


export async function generateRecommendations(input: GenerateRecommendationsInput): Promise<GenerateRecommendationsOutput> {
    const { profile, queries, userHistory, continuationToken, queryToContinue } = input;

    // --- PAGINATION LOGIC ---
    if (continuationToken && queryToContinue) {
        try {
            const moreResults = await searchYoutube({ query: queryToContinue, continuationToken });
            const freshTracks = rankAndFilterTracks(moreResults.tracks, profile, userHistory);
            return {
                tracks: freshTracks,
                nextContinuationToken: moreResults.nextContinuationToken,
                continuationQuery: queryToContinue, // Pass the query along
            };
        } catch (error) {
            console.error(`Failed to fetch more results for query: ${queryToContinue}`, error);
            return { tracks: [], nextContinuationToken: null, continuationQuery: null };
        }
    }

    // --- FALLBACK LOGIC ---
    if (queries.length === 0) {
        try {
            const trendingTracks = await getTrendingSongs();
            const freshTracks = rankAndFilterTracks(trendingTracks, profile, userHistory);
            return {
                tracks: freshTracks.slice(0, 20), // Limit trending results
                nextContinuationToken: null,
                continuationQuery: null
            };
        } catch (error) {
            console.error("Failed to fetch fallback trending songs:", error);
            return { tracks: [], nextContinuationToken: null, continuationQuery: null };
        }
    }

    // --- MULTI-QUERY SEARCH LOGIC ---
    try {
        const searchPromises = queries.map(q => searchYoutube({ query: q }));
        const searchResults = await Promise.all(searchPromises);

        // We only care about the first valid continuation token for the "load more" button
        const firstValidContinuation = searchResults.find(res => res.nextContinuationToken);
        const nextToken = firstValidContinuation?.nextContinuationToken || null;
        // Find which of our original queries provided this token
        const continuationQuery = nextToken ? queries[searchResults.indexOf(firstValidContinuation!)] : null;
        
        const allTracks = searchResults.flatMap(res => res.tracks);
        const finalTracks = rankAndFilterTracks(allTracks, profile, userHistory);

        return {
            tracks: finalTracks,
            nextContinuationToken: nextToken,
            continuationQuery: continuationQuery,
        };

    } catch (error) {
        console.error("Failed to fetch initial recommendations:", error);
        return { tracks: [], nextContinuationToken: null, continuationQuery: null };
    }
}
