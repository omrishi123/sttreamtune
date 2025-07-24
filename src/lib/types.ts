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
  'data-ai-hint'?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  likedSongs: string[];
  playlists: string[];
}
