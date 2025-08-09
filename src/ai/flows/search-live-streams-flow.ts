'use server';
/**
 * @fileOverview A YouTube live stream search utility.
 * 
 * - searchLiveStreams - A function that handles searching for live videos on YouTube.
 * - LiveStreamSearchInput - The input type for the searchLiveStreams function.
 * - LiveStreamSearchOutput - The return type for the searchLiveStreams function.
 */

import { z } from 'zod';
import { Track } from '@/lib/types';
import 'dotenv/config';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

const LiveStreamSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube live streams.'),
});
export type LiveStreamSearchInput = z.infer<typeof LiveStreamSearchInputSchema>;

const LiveStreamSearchOutputSchema = z.array(
  z.object({
    id: z.string(),
    youtubeVideoId: z.string(),
    title: z.string(),
    artist: z.string(), // Channel Title
    album: z.string(), // Will be "Live"
    artwork: z.string(),
    duration: z.number(), // Will be 0 for live streams
    'data-ai-hint': z.optional(z.string()),
  })
);
export type LiveStreamSearchOutput = z.infer<typeof LiveStreamSearchOutputSchema>;

export async function searchLiveStreams(input: LiveStreamSearchInput): Promise<LiveStreamSearchOutput> {
  if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }
  const url = new URL(YOUTUBE_API_URL);
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('q', input.query);
  url.searchParams.append('key', YOUTUBE_API_KEY);
  url.searchParams.append('type', 'video');
  url.searchParams.append('eventType', 'live'); // This is the key parameter for live streams
  url.searchParams.append('maxResults', '12');

  const response = await fetch(url.toString());

  if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube API Error:", errorText);
      throw new Error(`YouTube API request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error || !data.items) {
    console.error('YouTube API Live Search Error:', data.error);
    return [];
  }

  const tracks: Track[] = data.items.map((item: any) => ({
    id: item.id.videoId,
    youtubeVideoId: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    album: 'Live Stream',
    artwork: item.snippet.thumbnails.high.url,
    duration: 0, // Duration is not applicable for live streams
    'data-ai-hint': 'youtube live video'
  }));
  
  return tracks;
}
