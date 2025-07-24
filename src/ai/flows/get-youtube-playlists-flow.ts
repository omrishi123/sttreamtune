'use server';
/**
 * @fileOverview A YouTube playlist search flow.
 * 
 * - getYoutubePlaylists - A function that handles searching for playlists on YouTube.
 * - YoutubePlaylistsInput - The input type for the getYoutubePlaylists function.
 * - YoutubePlaylistsOutput - The return type for the getYoutubePlaylists function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Playlist } from '@/lib/types';
import 'dotenv/config';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_PLAYLISTS_API_URL = 'https://www.googleapis.com/youtube/v3/playlists';


const YoutubePlaylistsInputSchema = z.object({
  query: z.string().describe('The search query for YouTube playlists.'),
});
export type YoutubePlaylistsInput = z.infer<typeof YoutubePlaylistsInputSchema>;

const YoutubePlaylistDetailsInputSchema = z.object({
  playlistId: z.string().describe('The ID of the YouTube playlist.'),
});
export type YoutubePlaylistDetailsInput = z.infer<typeof YoutubePlaylistDetailsInputSchema>;


const YoutubePlaylistsOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    coverArt: z.string(),
    trackIds: z.array(z.string()),
    public: z.boolean(),
    owner: z.string(),
    'data-ai-hint': z.optional(z.string()),
  })
);
export type YoutubePlaylistsOutput = z.infer<typeof YoutubePlaylistsOutputSchema>;

const getYoutubePlaylistsFlow = ai.defineFlow(
  {
    name: 'getYoutubePlaylistsFlow',
    inputSchema: YoutubePlaylistsInputSchema,
    outputSchema: YoutubePlaylistsOutputSchema,
  },
  async (input) => {
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL(YOUTUBE_SEARCH_API_URL);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', input.query);
    url.searchParams.append('key', YOUTUBE_API_KEY);
    url.searchParams.append('type', 'playlist');
    url.searchParams.append('maxResults', '6');

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
      return [];
    }

    const playlists: Playlist[] = data.items
      .filter((item: any) => item.id && item.id.playlistId)
      .map((item: any): Playlist => ({
        id: item.id.playlistId,
        name: item.snippet.title,
        description: item.snippet.description,
        coverArt: item.snippet.thumbnails.high.url,
        trackIds: [], // We'll fetch these on demand
        public: true,
        owner: item.snippet.channelTitle,
        'data-ai-hint': 'youtube playlist'
      }));

    return playlists;
  }
);

export async function getYoutubePlaylists(input: YoutubePlaylistsInput): Promise<YoutubePlaylistsOutput> {
  return getYoutubePlaylistsFlow(input);
}


const getYoutubePlaylistDetailsFlow = ai.defineFlow(
  {
    name: 'getYoutubePlaylistDetailsFlow',
    inputSchema: YoutubePlaylistDetailsInputSchema,
    outputSchema: z.custom<Playlist>(),
  },
  async ({ playlistId }) => {
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL(YOUTUBE_PLAYLISTS_API_URL);
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('id', playlistId);
    url.searchParams.append('key', YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Playlist not found');
    }

    const item = data.items[0];
    const playlist: Playlist = {
      id: item.id,
      name: item.snippet.title,
      description: item.snippet.description,
      coverArt: item.snippet.thumbnails.high.url,
      trackIds: [], // Placeholder
      public: true,
      owner: item.snippet.channelTitle,
      'data-ai-hint': 'youtube playlist'
    };

    return playlist;
  }
);

export async function getYoutubePlaylistDetails(input: YoutubePlaylistDetailsInput): Promise<Playlist | undefined> {
    try {
        return await getYoutubePlaylistDetailsFlow(input);
    } catch (error) {
        console.error("Failed to get playlist details:", error);
        return undefined;
    }
}
