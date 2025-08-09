'use server';
/**
 * @fileOverview A utility to fetch trending music videos from YouTube.
 * 
 * - getTrendingSongs - A function that fetches the most popular music videos for a given region.
 * - TrendingSongsOutput - The return type for the getTrendingSongs function.
 */

import { z } from 'zod';
import { Track } from '@/lib/types';
import 'dotenv/config';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_VIDEOS_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

const TrendingSongsOutputSchema = z.array(
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
export type TrendingSongsOutput = z.infer<typeof TrendingSongsOutputSchema>;

function parseISODuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return (hours * 3600) + (minutes * 60) + seconds;
}


export async function getTrendingSongs(): Promise<TrendingSongsOutput> {
  if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }
  const url = new URL(YOUTUBE_VIDEOS_API_URL);
  url.searchParams.append('part', 'snippet,contentDetails');
  url.searchParams.append('chart', 'mostPopular');
  url.searchParams.append('regionCode', 'IN');
  url.search_params.append('videoCategoryId', '10'); // Music category
  url.searchParams.append('maxResults', '20');
  url.searchParams.append('key', YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube API Error:", errorText);
      throw new Error(`YouTube API request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error || !data.items) {
    console.error('YouTube API Trending Error:', data.error);
    return [];
  }

  const tracks: Track[] = data.items.map((item: any) => ({
    id: item.id,
    youtubeVideoId: item.id,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    album: 'Trending Now',
    artwork: item.snippet.thumbnails.high.url,
    duration: parseISODuration(item.contentDetails.duration),
    'data-ai-hint': 'trending music'
  }));
  
  return tracks;
}
