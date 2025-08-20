
'use server';
/**
 * @fileOverview An AI-powered song recommender based on search history.
 *
 * - generateRecommendations - A function that generates song recommendations.
 * - GenerateRecommendationsInput - The input type for the generateRecommendations function.
 * - GenerateRecommendationsOutput - The return type for the generateRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchYoutube, YoutubeSearchOutput } from './search-youtube-flow';
import { googleAI } from '@genkit-ai/googleai';

const GenerateRecommendationsInputSchema = z.object({
  history: z.array(z.string()).describe('A list of the user\'s recent search queries.'),
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;

export type GenerateRecommendationsOutput = YoutubeSearchOutput;

const RecommendationSuggestionSchema = z.object({
  songs: z.array(z.object({
      title: z.string().describe('The title of the song.'),
      artist: z.string().describe('The artist of the song.'),
    })).describe('A list of 15 new songs that are similar to the user\'s search history. Do not include songs that are already in the history.'),
});

export async function generateRecommendations(input: GenerateRecommendationsInput): Promise<GenerateRecommendationsOutput> {
  return generateRecommendationsFlow(input);
}

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: z.custom<GenerateRecommendationsOutput>(),
  },
  async ({ history }) => {
    // Step 1: Generate song ideas from the user's search history
    const suggestionPrompt = ai.definePrompt({
      name: 'recommendationSuggestionPrompt',
      input: { schema: GenerateRecommendationsInputSchema },
      output: { schema: RecommendationSuggestionSchema },
      model: googleAI.model('gemini-1.5-flash'),
      prompt: `You are a music expert and DJ. Based on the user's recent search history, recommend 15 new and interesting songs that they might like.
      Provide a diverse list of tracks that match the genres and artists they have searched for.

      User Search History:
      {{#each history}}
      - {{{this}}}
      {{/each}}
      `,
    });

    const { output: suggestion } = await suggestionPrompt({ history });

    if (!suggestion || suggestion.songs.length === 0) {
      console.log('AI did not generate any song suggestions.');
      return [];
    }

    // Step 2: Search for each song on YouTube in parallel to get track details
    const searchPromises = suggestion.songs.map(song => 
      searchYoutube({ query: `${song.title} by ${song.artist}` })
    );

    const searchResults = await Promise.all(searchPromises);
    
    // Step 3: Consolidate results into a flat list of tracks
    const foundTracks: YoutubeSearchOutput = searchResults
      .map(res => res[0]) // Take the top result for each search
      .filter((track): track is NonNullable<typeof track> => track !== null && track !== undefined);

    return foundTracks;
  }
);
