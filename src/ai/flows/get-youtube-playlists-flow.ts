'use server';
/**
 * @fileOverview A YouTube playlist search utility.
 * 
 * - getYoutubePlaylists - A function that handles searching for playlists on YouTube.
 * - YoutubePlaylistsInput - The input type for the getYoutubePlaylists function.
 * - YoutubePlaylistsOutput - The return type for the getYoutubePlaylists function.
 */

import { z } from 'zod';
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


export async function getYoutubePlaylists(input: YoutubePlaylistsInput): Promise<YoutubePlaylistsOutput> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }
  const url = new URL(YOUTUBE_SEARCH_API_URL);
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('q', input.query);
  url.searchParams.append('key', YOUTUBE_API_KEY);
  url.searchParams.append('type', 'playlist');
  url.searchParams.append('maxResults', '6');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error || !data.items) {
    console.error('YouTube API Playlist Search Error:', data.error);
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

export async function getYoutubePlaylistDetails({ playlistId }: YoutubePlaylistDetailsInput): Promise<Playlist | undefined> {
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL(YOUTUBE_PLAYLISTS_API_URL);
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('id', playlistId);
    url.searchParams.append('key', YOUTUBE_API_KEY);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.error || !data.items || data.items.length === 0) {
            console.error('YouTube API Playlist Details Error:', data.error);
            return undefined;
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
    } catch (error) {
        console.error("Failed to get playlist details:", error);
        return undefined;
    }
}
