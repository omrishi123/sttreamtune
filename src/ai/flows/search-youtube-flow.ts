'use server';
/**
 * @fileOverview A YouTube search utility using the Invidious API.
 * 
 * - searchYoutube - A function that handles searching for videos on YouTube via Invidious.
 * - YoutubeSearchInput - The input type for the searchYoutube function.
 * - YoutubeSearchOutput - The return type for the searchYoutube function.
 */

import { z } from 'zod';
import { Track } from '@/lib/types';

// Using a public Invidious instance. For production, self-hosting is recommended for stability.
const INVIDIOUS_API_URL = 'https://yewtu.be/api/v1/search';

const YoutubeSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube.'),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeSearchOutputSchema = z.array(
  z.object({
    id: z.string(),
    youtubeVideoId: z.string(),
    title: z.string(),
    artist: z.string(),
    album: z.string(),
    artwork: z.string(),
    duration: z.number(),
    'data-ai-hint': z.optional(z.string()),
  })
);
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

export async function searchYoutube(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  // The Invidious API expects a URL-encoded query string
  const url = new URL(INVIDIOUS_API_URL);
  url.searchParams.append('q', input.query);
  url.searchParams.append('type', 'video');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Invidious API Error:", errorText);
        throw new Error(`Invidious API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invidious API Search Error: Invalid response format');
      return [];
    }
    
    // Map the Invidious response format to our internal Track type
    const tracks: Track[] = data.map((item: any) => ({
      id: item.videoId,
      youtubeVideoId: item.videoId,
      title: item.title,
      artist: item.author,
      album: 'YouTube', // Invidious doesn't provide an album, so we use a default
      artwork: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`, // Construct the artwork URL
      duration: item.lengthSeconds || 0,
      'data-ai-hint': 'youtube video'
    })).slice(0, 10); // Limit to 10 results to match previous behavior
    
    return tracks;

  } catch (error) {
    console.error("Failed to fetch or parse Invidious search results:", error);
    // On any failure, return an empty array to prevent app crashes.
    return [];
  }
}
