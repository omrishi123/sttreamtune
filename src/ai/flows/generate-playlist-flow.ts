
'use server';
/**
 * @fileOverview An AI-powered playlist generator.
 *
 * - generatePlaylist - A function that handles the AI playlist generation process.
 * - GeneratePlaylistInput - The input type for the generatePlaylist function.
 * - GeneratePlaylistResponse - The return type for the generatePlaylist function, containing the new playlist and its tracks.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { searchYoutube, YoutubeSearchOutput } from './search-youtube-flow';
import { GeneratePlaylistResponse, GeneratePlaylistResponseSchema } from '@/lib/types';
import { nanoid } from 'nanoid';

const GeneratePlaylistInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the playlist to be generated.'),
  userId: z.string().describe("The ID of the user creating the playlist."),
  userName: z.string().describe("The name of the user creating the playlist."),
});
export type GeneratePlaylistInput = z.infer<typeof GeneratePlaylistInputSchema>;

const PlaylistSuggestionSchema = z.object({
  name: z.string().describe('A creative, short, and catchy name for the playlist. Max 3-4 words.'),
  description: z.string().describe('A brief, one-sentence description of the playlist vibe.'),
  coverArtPrompt: z.string().describe('A simple 2-3 word prompt for generating cover art, e.g., "synthwave sunset", "peaceful forest", "energetic workout".'),
  songs: z.array(z.object({
      title: z.string().describe('The title of the song.'),
      artist: z.string().describe('The artist of the song.'),
    })).describe('A list of 15-20 songs that fit the prompt. Include a mix of popular and lesser-known tracks if possible.'),
});

export async function generatePlaylist(input: GeneratePlaylistInput): Promise<GeneratePlaylistResponse> {
  const { playlist, tracks } = await generatePlaylistFlow(input);
  return { playlist, tracks };
}

const generatePlaylistFlow = ai.defineFlow(
  {
    name: 'generatePlaylistFlow',
    inputSchema: GeneratePlaylistInputSchema,
    outputSchema: GeneratePlaylistResponseSchema,
  },
  async (input) => {
    // Step 1: Generate playlist ideas and song list from the user prompt
    const suggestionPrompt = ai.definePrompt({
      name: 'playlistSuggestionPrompt',
      input: { schema: GeneratePlaylistInputSchema },
      output: { schema: PlaylistSuggestionSchema },
      model: googleAI.model('gemini-1.5-flash'),
      prompt: `You are a music expert and DJ. A user wants a new playlist.
      Based on their prompt, generate a creative playlist name, a short description, a simple prompt for cover art, and a list of songs.

      User Prompt: {{{prompt}}}
      `,
    });

    const { output: suggestion } = await suggestionPrompt(input);

    if (!suggestion) {
      throw new Error('Could not generate playlist suggestions.');
    }

    // Step 2: Generate cover art in parallel
    const imagePromise = ai.generate({
        model: googleAI.model('gemini-2.0-flash-preview-image-generation'),
        prompt: `Album cover for a playlist about ${suggestion.coverArtPrompt}. Clean, modern, vibrant, high-resolution.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
    });
    
    // Step 3: Search for each song on YouTube in parallel
    const searchPromises = suggestion.songs.map(song => 
      searchYoutube({ query: `${song.title} by ${song.artist}` })
    );

    const [imageResponse, ...searchResults] = await Promise.all([imagePromise, ...searchPromises]);
    
    // Step 4: Consolidate results
    const foundTracks: YoutubeSearchOutput = searchResults
      .map(res => res[0]) // Take the top result for each search
      .filter((track): track is NonNullable<typeof track> => track !== null && track !== undefined);

    const coverArtUrl = imageResponse.media?.url || 'https://placehold.co/300x300.png';

    // Step 5: Format the final playlist object
    const finalPlaylist = {
      id: `pl-ai-${nanoid(10)}`,
      name: suggestion.name,
      description: suggestion.description,
      owner: input.userName,
      public: false,
      trackIds: foundTracks.map(track => track.id),
      coverArt: coverArtUrl,
      'data-ai-hint': suggestion.coverArtPrompt,
    };
    
    return {
      playlist: finalPlaylist,
      tracks: foundTracks,
    };
  }
);
