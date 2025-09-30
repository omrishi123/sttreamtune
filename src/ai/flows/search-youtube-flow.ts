
'use server';
/**
 * @fileOverview A YouTube search utility that directly scrapes YouTube's search results.
 * 
 * - searchYoutube - A function that handles searching for videos by parsing YouTube's HTML response.
 * - YoutubeSearchInput - The input type for the searchYoutube function.
 * - YoutubeSearchOutput - The return type for the searchYoutube function.
 */

import { z } from 'zod';
import { Track } from '@/lib/types';

const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/results';

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


// Helper function to parse duration from "H:M:S" or "M:S" format to seconds
const parseDuration = (durationText: string | undefined): number => {
    if (!durationText) return 0;
    const parts = durationText.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parts[0] * 3600; // hours
        seconds += parts[1] * 60;   // minutes
        seconds += parts[2];        // seconds
    } else if (parts.length === 2) {
        seconds += parts[0] * 60;   // minutes
        seconds += parts[1];        // seconds
    } else if (parts.length === 1) {
        seconds += parts[0];        // seconds
    }
    return seconds;
};

export async function searchYoutube(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.append('search_query', input.query);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // Using a common user-agent can help avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube Scraping Error:", errorText);
        throw new Error(`YouTube scraping failed with status ${response.status}`);
    }

    const html = await response.text();
    
    // Find the script tag containing 'ytInitialData'
    const match = html.match(/var ytInitialData = (.*?);<\/script>/);
    if (!match || !match[1]) {
      console.error('Could not find ytInitialData in YouTube response.');
      return [];
    }

    const data = JSON.parse(match[1]);

    // Navigate the complex JSON structure to find video results
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents || !Array.isArray(contents)) {
        console.error('Invalid data structure in ytInitialData.');
        return [];
    }
    
    const itemSection = contents.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer?.contents;
    if (!itemSection) {
        console.error('Could not find itemSectionRenderer in contents.');
        return [];
    }

    const tracks: Track[] = itemSection
      .filter((item: any) => item.videoRenderer)
      .map((item: any) => {
        const renderer = item.videoRenderer;
        const title = renderer.title?.runs?.[0]?.text || 'Unknown Title';
        const artist = renderer.longBylineText?.runs?.[0]?.text || 'Unknown Artist';
        const durationText = renderer.lengthText?.simpleText;

        return {
          id: renderer.videoId,
          youtubeVideoId: renderer.videoId,
          title: title,
          artist: artist,
          album: 'YouTube',
          artwork: `https://i.ytimg.com/vi/${renderer.videoId}/hqdefault.jpg`,
          duration: parseDuration(durationText),
          'data-ai-hint': 'youtube video'
        };
      })
      .slice(0, 15); // Limit results to a reasonable number

    return tracks;

  } catch (error) {
    console.error("Failed to fetch or parse YouTube search results:", error);
    // On any failure, return an empty array to prevent app crashes.
    return [];
  }
}
