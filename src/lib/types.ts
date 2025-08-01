
import {z} from 'zod';

export interface Track {
  id: string;
  youtubeVideoId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number; // in seconds
  'data-ai-hint'?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  trackIds: string[];
  public: boolean;
  owner: string; // user display name
  ownerId?: string; // user's unique ID
  'data-ai-hint'?: string;
  isLikedSongs?: boolean;
  tracks?: Track[]; // For public playlists, embed full track objects
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface UserData {
  likedSongs: string[];
  playlists: Playlist[];
  recentlyPlayed: string[];
}

export const GeneratePlaylistResponseSchema = z.object({
  playlist: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    coverArt: z.string(),
    trackIds: z.array(z.string()),
    public: z.boolean(),
    owner: z.string(),
    ownerId: z.optional(z.string()),
    'data-ai-hint': z.optional(z.string()),
    isLikedSongs: z.optional(z.boolean()),
  }),
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
  generatedCoverArt: z.string().optional(),
});
export type GeneratePlaylistResponse = z.infer<
  typeof GeneratePlaylistResponseSchema
>;
