'use server';
/**
 * @fileOverview A YouTube search flow.
 * 
 * - searchYoutube - A function that handles searching for videos on YouTube.
 * - YoutubeSearchInput - The input type for the searchYoutube function.
 * - YoutubeSearchOutput - The return type for the searchYoutube function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Track } from '@/lib/types';
import 'dotenv/config';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

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

async function getVideosDurations(videoIds: string[]): Promise<Map<string, number>> {
    if (!YOUTUBE_API_KEY) {
        throw new Error("NEXT_PUBLIC_YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL(YOUTUBE_VIDEOS_API_URL);
    url.searchParams.append('part', 'contentDetails');
    url.searchParams.append('id', videoIds.join(','));
    url.searchParams.append('key', YOUTUBE_API_KEY);
  
    const response = await fetch(url);
    const data = await response.json();
  
    const durations = new Map<string, number>();
    if (data.items) {
      for (const item of data.items) {
        const durationISO = item.contentDetails.duration;
        // Convert ISO 8601 duration to seconds
        const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (parseInt(match?.[1] ?? '0') || 0);
        const minutes = (parseInt(match?.[2] ?? '0') || 0);
        const seconds = (parseInt(match?.[3] ?? '0') || 0);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        durations.set(item.id, totalSeconds);
      }
    }
    return durations;
  }

const searchYoutubeFlow = ai.defineFlow(
  {
    name: 'searchYoutubeFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (input) => {
    if (!YOUTUBE_API_KEY) {
        throw new Error("NEXT_PUBLIC_YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL(YOUTUBE_API_URL);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', `${input.query} official audio`);
    url.searchParams.append('key', YOUTUBE_API_KEY);
    url.searchParams.append('type', 'video');
    url.searchParams.append('maxResults', '10');

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API Error:", errorText);
        throw new Error(`YouTube API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error || !data.items) {
      console.error('YouTube API Search Error:', data.error);
      return [];
    }

    const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean);
    const durations = await getVideosDurations(videoIds);

    const tracks: Track[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      youtubeVideoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: 'YouTube',
      artwork: item.snippet.thumbnails.high.url,
      duration: durations.get(item.id.videoId) || 0,
      'data-ai-hint': 'youtube video'
    }));
    
    return tracks;
  }
);

export async function searchYoutube(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  return searchYoutubeFlow(input);
}
