

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
  isLocal?: boolean; // To distinguish between youtube and local tracks
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
  ownerIsVerified?: boolean; // To display verification badge
  'data-ai-hint'?: string;
  isLikedSongs?: boolean;
  tracks?: Track[]; // For public playlists, embed full track objects
  isFeatured?: boolean;
  isChannelPlaylist?: boolean; // To identify playlists managed within a channel
}

export interface Channel {
  id: string; // YouTube Channel ID
  name: string;
  logo: string;
  uploads: Track[];
  playlists: Playlist[];
}

export interface User {
  id:string;
  name: string;
  email: string;
  photoURL?: string;
  isAdmin?: boolean; // Add isAdmin flag
  isVerified?: boolean; // Add isVerified flag
}

export interface UserData {
  likedSongs: string[];
  playlists: Playlist[];
  recentlyPlayed: string[];
  channels: Channel[];
}

// New type for user activity tracking
export interface UserActivity {
  deviceId: string;
  userId: string;
  userName: string;
  lastSeen: string; // ISO string
  isGuest: boolean;
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
    ownerIsVerified: z.optional(z.boolean()),
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
