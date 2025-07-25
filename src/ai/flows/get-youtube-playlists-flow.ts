'use server';
/**
 * @fileOverview A YouTube playlist search utility.
 * 
 * - getYoutubePlaylists - A function that handles searching for playlists on YouTube.
 * - YoutubePlaylistsInput - The input type for the getYoutubePlaylists function.
 * - YoutubePlaylistsOutput - The return type for the getYoutubePlaylists function.
 */

import { z } from 'zod';
import { Playlist, Track } from '@/lib/types';
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

export async function getTracksForPlaylist(playlistId: string): Promise<Track[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error("YOUTUBE_API_KEY is not set.");
        return [];
    }

    let allTracks: Track[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
        do {
            const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
            url.searchParams.append('part', 'snippet,contentDetails');
            url.searchParams.append('playlistId', playlistId);
            url.searchParams.append('key', apiKey);
            url.searchParams.append('maxResults', '50');
            if (nextPageToken) {
                url.searchParams.append('pageToken', nextPageToken);
            }

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.error || !data.items) {
                console.error('YouTube API Error fetching playlist items:', data.error);
                break;
            }

            const videoIds = data.items
              .map((item: any) => item.contentDetails?.videoId)
              .filter(Boolean);

            if (videoIds.length === 0) {
              nextPageToken = data.nextPageToken;
              continue;
            }

            const durations = await getVideosDurations(videoIds);

            const fetchedTracks: Track[] = data.items
                .filter((item: any) => item.contentDetails?.videoId)
                .map((item: any): Track => ({
                    id: item.contentDetails.videoId,
                    youtubeVideoId: item.contentDetails.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
                    album: 'YouTube Playlist',
                    artwork: item.snippet.thumbnails?.high?.url || 'https://placehold.co/300x300.png',
                    duration: durations.get(item.contentDetails.videoId) || 0,
                    'data-ai-hint': 'youtube video'
                }));

            allTracks = allTracks.concat(fetchedTracks);
            nextPageToken = data.nextPageToken;

        } while (nextPageToken);

        return allTracks;

    } catch (error) {
        console.error('Failed to fetch playlist tracks:', error);
        return [];
    }
}

async function getVideosDurations(videoIds: string[]): Promise<Map<string, number>> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.append('part', 'contentDetails');
    url.searchParams.append('id', videoIds.join(','));
    url.searchParams.append('key', apiKey);

    const response = await fetch(url);
    const data = await response.json();

    const durations = new Map<string, number>();
    if (data.items) {
      for (const item of data.items) {
        const durationISO = item.contentDetails.duration;
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
