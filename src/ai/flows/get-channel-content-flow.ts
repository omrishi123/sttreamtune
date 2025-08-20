
'use server';
/**
 * @fileOverview A utility to fetch all content (uploads and playlists) from a YouTube channel.
 */

import { z } from 'zod';
import { Track, Playlist } from '@/lib/types';
import 'dotenv/config';
import { getTracksForPlaylist } from './get-youtube-playlists-flow';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Input schema for the flow
const GetChannelContentInputSchema = z.object({
  channelUrl: z.string().describe('The URL of the YouTube channel.'),
  importType: z.enum(['all', 'uploads', 'playlists']).default('all').describe('The type of content to import.'),
});
export type GetChannelContentInput = z.infer<typeof GetChannelContentInputSchema>;

// Output schema for the flow
const GetChannelContentOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string(),
    uploads: z.array(z.custom<Track>()),
    playlists: z.array(z.custom<Playlist>()),
});
export type GetChannelContentOutput = z.infer<typeof GetChannelContentOutputSchema>;


// Helper function to extract channel ID or username from URL
function extractIdentifierFromUrl(url: string): string | null {
    // Matches @handle, /channel/ID, /c/username, /user/username
    const regex = /(?:@([a-zA-Z0-9_.-]+)|(?:channel|c|user)\/([a-zA-Z0-9_.-]+))/;
    const match = url.match(regex);
    return match ? (match[1] || match[2]) : null;
}

// Function to get channel details by username or custom URL handle
async function getChannelBySearch(identifier: string) {
    if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not set.");
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', identifier);
    url.searchParams.append('type', 'channel');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
    }
    return null;
}

// Main function to fetch all channel content
export async function getChannelContent(input: GetChannelContentInput): Promise<GetChannelContentOutput> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }
  
  const identifier = extractIdentifierFromUrl(input.channelUrl);
  if (!identifier) {
      throw new Error("Could not extract a valid channel ID or username from the URL.");
  }

  // --- 1. Get Channel ID and Details ---
  let channelId: string | null = null;
  const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelUrl.searchParams.append('part', 'snippet,contentDetails');
  channelUrl.searchParams.append('key', YOUTUBE_API_KEY);

  // Try fetching by ID first
  channelUrl.searchParams.append('id', identifier);
  let channelResponse = await fetch(channelUrl.toString());
  let channelData = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
      // If not found by ID, try searching by username/handle
      channelUrl.searchParams.delete('id');
      channelUrl.searchParams.append('forUsername', identifier);
      channelResponse = await fetch(channelUrl.toString());
      channelData = await channelResponse.json();
  }

  if (!channelData.items || channelData.items.length === 0) {
     // If still not found, try the search API as a last resort
     channelId = await getChannelBySearch(identifier);
     if(channelId) {
        channelUrl.searchParams.delete('forUsername');
        channelUrl.searchParams.append('id', channelId);
        channelResponse = await fetch(channelUrl.toString());
        channelData = await channelResponse.json();
     } else {
        throw new Error('Channel not found.');
     }
  }
  
  const channelDetails = channelData.items[0];
  channelId = channelDetails.id;
  const uploadsPlaylistId = channelDetails.contentDetails.relatedPlaylists.uploads;

  let uploadedTracks: Track[] = [];
  let channelPlaylists: Playlist[] = [];
  
  // --- 2. Fetch All Uploaded Videos (conditional) ---
  if (input.importType === 'all' || input.importType === 'uploads') {
    uploadedTracks = await getTracksForPlaylist(uploadsPlaylistId);
  }


  // --- 3. Fetch All Public Playlists (conditional) ---
  if (input.importType === 'all' || input.importType === 'playlists') {
    let nextPageToken: string | undefined = undefined;
    const rawPlaylists: any[] = [];
    do {
        const playlistsUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
        playlistsUrl.searchParams.append('part', 'snippet,contentDetails');
        playlistsUrl.searchParams.append('channelId', channelId);
        playlistsUrl.searchParams.append('maxResults', '50');
        playlistsUrl.searchParams.append('key', YOUTUBE_API_KEY);
        if (nextPageToken) {
            playlistsUrl.searchParams.append('pageToken', nextPageToken);
        }
        
        const playlistsResponse = await fetch(playlistsUrl.toString());
        const playlistsData = await playlistsResponse.json();

        if (playlistsData.items) {
          rawPlaylists.push(...playlistsData.items);
        }
        nextPageToken = playlistsData.nextPageToken;
    } while (nextPageToken);

    // Now fetch tracks for each playlist
    const playlistPromises = rawPlaylists.map(async (item: any) => {
        const tracks = await getTracksForPlaylist(item.id);
        const playlist: Playlist = {
            id: item.id,
            name: item.snippet.title,
            description: item.snippet.description,
            coverArt: item.snippet.thumbnails.high.url,
            trackIds: tracks.map(t => t.id),
            tracks: tracks,
            public: true,
            owner: channelDetails.snippet.title,
            'data-ai-hint': 'youtube playlist'
        };
        return playlist;
    });

    channelPlaylists = await Promise.all(playlistPromises);
  }


  // --- 4. Assemble and Return ---
  return {
    id: channelId,
    name: channelDetails.snippet.title,
    logo: channelDetails.snippet.thumbnails.high.url,
    uploads: uploadedTracks,
    playlists: channelPlaylists,
  };
}
