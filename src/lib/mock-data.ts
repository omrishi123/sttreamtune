import type { Track, Playlist } from './types';

export const tracks: Track[] = [
  { id: '1', youtubeVideoId: 'dQw4w9WgXcQ', title: 'Starlight Serenade', artist: 'Cosmic Echoes', album: 'Celestial Dreams', artwork: 'https://placehold.co/300x300.png', duration: 210, 'data-ai-hint': 'album cover' },
  { id: '2', youtubeVideoId: 'o-YBDTqX_ZU', title: 'Oceanic Whispers', artist: 'Tidal Waves', album: 'Deep Blue', artwork: 'https://placehold.co/300x300.png', duration: 245, 'data-ai-hint': 'ocean wave' },
  { id: '3', youtubeVideoId: '3tmd-ClpJxA', title: 'City of Neon', artist: 'Synth Riders', album: 'Nightfall', artwork: 'https://placehold.co/300x300.png', duration: 180, 'data-ai-hint': 'neon city' },
  { id: '4', youtubeVideoId: '9bZkp7q19f0', title: 'Forest Lullaby', artist: 'Earthen Tune', album: 'Whispering Woods', artwork: 'https://placehold.co/300x300.png', duration: 270, 'data-ai-hint': 'mystical forest' },
  { id: '5', youtubeVideoId: 'hY7m5jjJ9e4', title: 'Desert Mirage', artist: 'Sand Drifters', album: 'Golden Dunes', artwork: 'https://placehold.co/300x300.png', duration: 195, 'data-ai-hint': 'vast desert' },
  { id: '6', youtubeVideoId: 'pA-u_1P63_s', title: 'Mountain Echo', artist: 'Peak Harmonix', album: 'Summit Songs', artwork: 'https://placehold.co/300x300.png', duration: 220, 'data-ai-hint': 'snowy mountain' },
  { id: '7', youtubeVideoId: 'I1S_fkI_3r4', title: 'Retro Groove', artist: 'The Funkalistics', album: 'Vinyl Days', artwork: 'https://placehold.co/300x300.png', duration: 188, 'data-ai-hint': 'retro vinyl' },
  { id: '8', youtubeVideoId: 'k4yXQkG2s1E', title: 'Future Pulse', artist: 'Chrono Beats', album: 'Time Warp', artwork: 'https://placehold.co/300x300.png', duration: 205, 'data-ai-hint': 'futuristic abstract' },
  { id: '9', youtubeVideoId: 'F1B9Fk_SgI0', title: 'Island Rhythm', artist: 'Reggae Roots', album: 'Sun-Kissed', artwork: 'https://placehold.co/300x300.png', duration: 230, 'data-ai-hint': 'tropical island' },
  { id: '10', youtubeVideoId: 'MVbeo_o23Mk', title: 'Midnight Jazz', artist: 'The Night Owls', album: 'After Hours', artwork: 'https://placehold.co/300x300.png', duration: 300, 'data-ai-hint': 'jazz club' },
];

export const playlists: Playlist[] = [
  { id: 'pl-1', name: 'Workout Hits', description: 'High-energy tracks to keep you motivated.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['3', '7', '8'], public: true, owner: 'StreamTune', 'data-ai-hint': 'gym workout' },
  { id: 'pl-2', name: 'Chill Focus', description: 'Instrumental beats for concentration.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['2', '4', '10'], public: true, owner: 'StreamTune', 'data-ai-hint': 'person studying' },
  { id: 'pl-3', name: 'Top 100', description: 'The most popular tracks right now.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], public: true, owner: 'StreamTune', 'data-ai-hint': 'music chart' },
  { id: 'pl-4', name: 'Cosmic Dreams', description: 'Embark on a journey through sound.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['1', '8'], public: true, owner: 'StreamTune', 'data-ai-hint': 'galaxy stars' },
  { id: 'pl-5', name: 'Nature Walk', description: 'Calm and soothing sounds of nature.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['2', '4', '6', '9'], public: true, owner: 'StreamTune', 'data-ai-hint': 'forest path' },
  { id: 'pl-6', name: 'Liked Songs', description: 'Your collection of favorite tracks.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['1', '5', '9'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'glowing heart' },
  { id: 'pl-7', name: 'My Roadtrip', description: 'Songs for the open road.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['3', '5', '7'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'car roadtrip' },
  { id: 'pl-8', name: 'Morning Coffee', description: 'Acoustic and mellow tunes.', coverArt: 'https://placehold.co/300x300.png', trackIds: ['4', '10'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'morning coffee' },
];

export const userPlaylists = playlists.filter(p => !p.public);

export const getPlaylistById = async (id: string): Promise<Playlist | undefined> => {
    // In a real app, you'd fetch this from your DB or the YouTube API.
    // For now, we'll check our mock data, but this might not be sufficient
    // if the playlist is coming directly from the new YouTube playlist flow.
    const mockPlaylist = playlists.find(p => p.id === id);
    if(mockPlaylist) return mockPlaylist;
    
    // This part is tricky because we don't have a direct way to fetch a single
    // playlist from youtube by its ID without a new flow. 
    // For the scope of this change, we'll assume the playlist details are passed
    // or we can make a new call if necessary.
    // Placeholder for fetching from YouTube API by ID if needed.
    return undefined;
}

export const getTracksForPlaylist = async (playlistId: string): Promise<Track[]> => {
    if (!process.env.YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY is not set.");
        return [];
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('playlistId', playlistId);
    url.searchParams.append('key', process.env.YOUTUBE_API_KEY);
    url.searchParams.append('maxResults', '20');

    try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.error || !data.items) {
            console.error('YouTube API Error fetching playlist items:', data.error);
            return [];
        }

        const videoIds = data.items.map((item: any) => item.contentDetails.videoId).filter(Boolean);
        const durations = await getVideosDurations(videoIds);
        
        const tracks: Track[] = data.items.map((item: any): Track => ({
            id: item.contentDetails.videoId,
            youtubeVideoId: item.contentDetails.videoId,
            title: item.snippet.title,
            artist: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
            album: 'YouTube Playlist',
            artwork: item.snippet.thumbnails?.high?.url || 'https://placehold.co/300x300.png',
            duration: durations.get(item.contentDetails.videoId) || 0,
            'data-ai-hint': 'youtube video'
        }));

        return tracks;

    } catch (error) {
        console.error('Failed to fetch playlist tracks:', error);
        return [];
    }
}

async function getVideosDurations(videoIds: string[]): Promise<Map<string, number>> {
    if (!process.env.YOUTUBE_API_KEY) {
        throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
    }
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.append('part', 'contentDetails');
    url.searchParams.append('id', videoIds.join(','));
    url.searchParams.append('key', process.env.YOUTUBE_API_KEY);
  
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
