
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
  isPublic: z.boolean().describe("Whether the playlist should be public."),
  playlistId: z.string().describe("A pre-generated unique ID for the playlist."),
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
  const { playlist, tracks, generatedCoverArt } = await generatePlaylistFlow(input);
  // Return the generatedCoverArt separately so the frontend can display it immediately,
  // but it's not saved to the database for public playlists to avoid size limit errors.
  return { playlist, tracks, generatedCoverArt };
}

const generatePlaylistFlow = ai.defineFlow(
  {
    name: 'generatePlaylistFlow',
    inputSchema: GeneratePlaylistInputSchema,
    outputSchema: z.object({
      playlist: GeneratePlaylistResponseSchema.shape.playlist,
      tracks: GeneratePlaylistResponseSchema.shape.tracks,
      generatedCoverArt: z.string().optional(),
    }),
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
        model: googleAI.model('gemini-1.5-flash'),
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

    const generatedCoverArt = imageResponse.media?.url;

    // Use the first track's artwork as the cover, or a placeholder if no tracks are found.
    const coverArtUrl = foundTracks.length > 0 ? foundTracks[0].artwork : 'https://i.postimg.cc/SswWC87w/streamtune.png';

    // Step 5: Format the final playlist object
    const finalPlaylist = {
      id: input.playlistId, // Use the ID passed from the client
      name: suggestion.name,
      description: suggestion.description,
      owner: input.userName,
      public: input.isPublic,
      trackIds: foundTracks.map(track => track.id),
      coverArt: coverArtUrl, // Use the first track's artwork or a placeholder.
      ownerId: input.userId, // Ensure the ownerId is always set
      'data-ai-hint': suggestion.coverArtPrompt,
    };
    
    return {
      playlist: finalPlaylist,
      tracks: foundTracks,
      // For private playlists, we can return the AI-generated art for immediate use.
      // The dialog component will decide whether to use it.
      generatedCoverArt: generatedCoverArt, 
    };
  }
);
