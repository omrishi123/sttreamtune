
'use server';
/**
 * @fileOverview A YouTube search utility that directly scrapes YouTube's search results and supports pagination.
 * 
 * - searchYoutube - A function that handles searching for videos by parsing YouTube's HTML response and handling continuation tokens.
 * - YoutubeSearchInput - The input type for the searchYoutube function.
 * - YoutubeSearchOutput - The return type for the searchYoutube function.
 */

import { z } from 'zod';
import { Track } from '@/lib/types';

const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/results';
const YOUTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/search';

const YoutubeSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube.'),
  continuationToken: z.string().optional().describe('The token for fetching the next page of results.'),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeSearchOutputSchema = z.object({
    tracks: z.array(
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
    ),
    nextContinuationToken: z.string().nullable(),
});
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

// Helper function to extract tracks and continuation token from YouTube's data structure
const parseYouTubeData = (data: any): { tracks: Track[], continuationToken: string | null } => {
    const contents = data?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems ||
                     data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (!contents || !Array.isArray(contents)) {
        console.error('Invalid data structure in parseYouTubeData.');
        return { tracks: [], continuationToken: null };
    }

    let itemSection = contents.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer?.contents;
    
    if (!itemSection && contents.length > 0) {
        itemSection = contents;
    }

    if (!itemSection) {
        console.error('Could not find itemSectionRenderer in contents for tracks.');
        return { tracks: [], continuationToken: null };
    }
    
    const tracks: Track[] = itemSection
      .filter((item: any) => {
        if (!item.videoRenderer) return false;
        // Filter out shorts: Check if duration is too short (less than 90 seconds)
        const duration = parseDuration(item.videoRenderer.lengthText?.simpleText);
        return duration >= 90;
      })
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
      });

    // Find the continuation token for the next page
    const continuationItem = contents.find((c: any) => c.continuationItemRenderer)?.continuationItemRenderer;
    const continuationToken = continuationItem?.continuationEndpoint?.continuationCommand?.token || null;
      
    return { tracks, continuationToken };
};


export async function searchYoutube(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    let response;
    let data;

    if (input.continuationToken) {
      // Logic for fetching subsequent pages
      response = await fetch(YOUTUBE_API_URL, {
        method: 'POST',
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20210721.00.00",
            },
          },
          continuation: input.continuationToken,
        }),
      });
      data = await response.json();
    } else {
      // Logic for the initial search
      const url = new URL(YOUTUBE_SEARCH_URL);
      url.searchParams.append('search_query', input.query);
      response = await fetch(url.toString(), { headers: commonHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`YouTube scraping failed with status ${response.status}: ${errorText}`);
      }
      
      const html = await response.text();
      const match = html.match(/var ytInitialData = (.*?);<\/script>/);
      if (!match || !match[1]) {
        throw new Error('Could not find ytInitialData in YouTube response.');
      }
      data = JSON.parse(match[1]);
    }

    const { tracks, continuationToken: nextContinuationToken } = parseYouTubeData(data);
    
    return { tracks, nextContinuationToken };

  } catch (error) {
    console.error("Failed to fetch or parse YouTube search results:", error);
    return { tracks: [], nextContinuationToken: null };
  }
}
