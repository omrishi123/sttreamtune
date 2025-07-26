
'use server';
/**
 * @fileOverview An AI-powered playlist generator.
 *
 * - generatePlaylist - Creates a playlist based on a user's text prompt.
 * - GeneratePlaylistInput - The input type for the generatePlaylist function.
 * - GeneratePlaylistResponse - The return type for the generatePlaylist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {searchYoutube} from './search-youtube-flow';
import type {Track, Playlist} from '@/lib/types';
import {
  GeneratePlaylistResponseSchema,
  type GeneratePlaylistResponse,
} from '@/lib/types';
import {nanoid} from 'nanoid';
import { googleAI } from '@genkit-ai/googleai';

// 1. Define Input and Output Schemas with Zod and TypeScript
const GeneratePlaylistInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the desired playlist.'),
});
export type GeneratePlaylistInput = z.infer<
  typeof GeneratePlaylistInputSchema
>;

const GeneratePlaylistOutputSchema = z.object({
  name: z.string().describe('A creative name for the generated playlist.'),
  description: z
    .string()
    .describe('A short, compelling description for the playlist.'),
  songs: z
    .array(
      z.object({
        title: z.string().describe('The title of the song.'),
        artist: z.string().describe('The name of the artist.'),
      })
    )
    .describe('A list of 5 songs that match the prompt.'),
});

// 2. Define the Genkit Prompt
const playlistPrompt = ai.definePrompt({
  name: 'playlistPrompt',
  model: googleAI('gemini-1.5-flash-latest'),
  input: {schema: GeneratePlaylistInputSchema},
  output: {schema: GeneratePlaylistOutputSchema},
  prompt: `You are an expert music curator. Based on the user's prompt, create a playlist with a creative name, a short description, and a list of 5 songs.

Prompt: {{{prompt}}}`,
});

// 3. Define the main Genkit Flow
const generatePlaylistFlow = ai.defineFlow(
  {
    name: 'generatePlaylistFlow',
    inputSchema: GeneratePlaylistInputSchema,
    outputSchema: GeneratePlaylistResponseSchema,
  },
  async (input: GeneratePlaylistInput): Promise<GeneratePlaylistResponse> => {
    // Step 1: Call the AI to get song ideas and playlist metadata
    const {output: playlistData} = await playlistPrompt(input);
    if (!playlistData) {
      throw new Error('Failed to generate playlist ideas from AI.');
    }

    // Step 2: Search YouTube for each recommended song to get playable tracks
    const trackPromises = playlistData.songs.map(song =>
      searchYoutube({query: `${song.title} by ${song.artist}`})
    );
    const searchResults = await Promise.all(trackPromises);

    // Flatten the results and filter out any empty searches
    const foundTracks: Track[] = searchResults
      .flat()
      .filter((track): track is Track => !!track);

    // Create a unique set of tracks based on ID to avoid duplicates
    const uniqueTracks = Array.from(
      new Map(foundTracks.map(track => [track.id, track])).values()
    );

    if (uniqueTracks.length === 0) {
      throw new Error('Could not find any playable tracks for this prompt.');
    }

    // Step 3: Construct the final Playlist and Track objects
    const newPlaylist: Playlist = {
      id: `pl-ai-${nanoid(10)}`,
      name: playlistData.name,
      description: playlistData.description,
      owner: 'AI Curator',
      public: true,
      trackIds: uniqueTracks.map(t => t.id),
      coverArt:
        uniqueTracks[0].artwork || 'https://placehold.co/300x300.png',
      'data-ai-hint': 'abstract music art',
    };

    return {
      playlist: newPlaylist,
      tracks: uniqueTracks,
    };
  }
);

// 4. Create an exported wrapper function for the client to call
export async function generatePlaylist(
  input: GeneratePlaylistInput
): Promise<GeneratePlaylistResponse> {
  return generatePlaylistFlow(input);
}
