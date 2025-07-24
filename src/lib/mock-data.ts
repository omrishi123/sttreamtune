
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

export const homePagePlaylists: { title: string, playlists: Playlist[] }[] = [
    {
      "title": "Top Hits",
      "playlists": [
        {
          "id": "PL9bw4S5ePsEEqCMJSiYZ-KTtEjzVy0YvK",
          "name": "Best of Bollywood Hindi Love Songs ",
          "description": "Listen to all the trending songs of the week in this playlist!",
          "coverArt": "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6NmK47v6tpOcxurcxdW-hZa",
          "name": "Latest Bollywood Songs 2025",
          "description": "Trending songs are the most popular songs that are being listened to by a large number of people.",
          "coverArt": "https://i.ytimg.com/vi/aA6II82-4cI/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL9bw4S5ePsEGrOA88bJtxgfKaN2HPhkNS",
          "name": "Bollywood Top 50",
          "description": "Presenting the Top 50 songs of the week for all the Bollywood fans.",
          "coverArt": "https://i.ytimg.com/vi/KoAIsL52jH8/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "New Songs",
      "playlists": [
        {
          "id": "PLO7-VO1D0_6MnOoKQGmYNY2OoCOP3GRfm",
          "name": "Hindi New Song 2025",
          "description": "Hindi New Song 2025.",
          "coverArt": "https://i.ytimg.com/vi/h390c8a_54Y/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL9bw4S5ePsEF-J_tIORZ6xE_OXkGuKjjY",
          "name": "Party Songs",
          "description": "Hanuman is a Hindu god and a divine vanara companion of the god Rama.",
          "coverArt": "https://i.ytimg.com/vi/1_omv_G2g-E/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6M1xUjj8HxTxskouWx48SNw",
          "name": "Bollywood Songs ",
          "description": "Shiva is one of the principal deities of Hinduism.",
          "coverArt": "https://i.ytimg.com/vi/YqeW9_5kURI/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "Bollywood",
      "playlists": [
        {
          "id": "PLwgf_2_aBmU1kYCWHfvX9kVhKoof35qzg",
          "name": "Bollywood Dance",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/1_omv_G2g-E/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv",
          "name": "Spotify Playlist",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/Lme-AZ1n7dM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6NYoMAN0XncJu4tvibirSmN",
          "name": "Punjabi Song Playlist",
          "description": "Sad songs are songs that make you feel sad.",
          "coverArt": "https://i.ytimg.com/vi/eY2kew8n2u4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "Featured Playlists",
      "playlists": [
        {
          "id": "PLEK4199_zBwCqNxwJygffUonzfROKn0Kh",
          "name": "Punjabi Hits",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/x2o1xY-ldfM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLf0EVMk_zZgYD7bfe6KDmRtf58M9EjOEn",
          "name": "Punjabi Hits SPOTIFY",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/Otf9-iRw2pE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLNCA1T91UH31M7mN8iKSxMwwWB_mkzwT6",
          "name": "Punjabi Songs",
          "description": "Punjabi songs are the most popular songs in India.",
          "coverArt": "https://i.ytimg.com/vi/5g0__-cEec4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLmfcCDSUSykbw9ewtVgSDKazPDwoTBm8E",
          "name": "Punjabi Hits",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/mN6r9Dk2TfE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLdYKFelfD72exdwCQ6XzPzJDvc91tCpKm",
          "name": "Romantic Songs PUNJABI",
          "description": "A playlist of romantic songs from Bollywood.",
          "coverArt": "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLyORnIW1xT6xk8134gbFnvDrD6mXiIlrF",
          "name": "Pop",
          "description": "Pop music is a genre of popular music that originated in its modern form during the mid-1950s in the United States and the United Kingdom.",
          "coverArt": "https://i.ytimg.com/vi/YqeW9_5kURI/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "Artist Mixes",
      "playlists": [
        {
          "id": "PL-oM5qTjmK2vxdTsj2Xghu5fjxhtuMaxo",
          "name": "punjabi songs 2025",
          "description": "Arijit Singh is an Indian singer and music composer.",
          "coverArt": "https://i.ytimg.com/vi/u3y8-o4j4gE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLFFyMei_d85XaYHYUy8gFt_TQ7LqBNgEv",
          "name": " Punjabi Songs 2025 ",
          "description": "Neha Kakkar Singh is an Indian singer.",
          "coverArt": "https://i.ytimg.com/vi/hpwnlr-Zp6Y/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLFFyMei_d85X5UuHRCJ63jcl84x--WGLu",
          "name": "PUNJABI HITS",
          "description": "Jubin Nautiyal is an Indian playback singer and performer.",
          "coverArt": "https://i.ytimg.com/vi/hpwnlr-Zp6Y/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6N2ePPlPE9NKCgUBA15aOk2",
          "name": "English Songs",
          "description": "Sonu Nigam is an Indian singer, music director and actor.",
          "coverArt": "https://i.ytimg.com/vi/C9xZ4S0p1c4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLDIoUOhQQPlXzhp-83rECoLaV6BwFtNC4",
          "name": "English Songs",
          "description": "Lata Mangeshkar was an Indian playback singer and occasional music composer.",
          "coverArt": "https://i.ytimg.com/vi/T8iS1f4i4cE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLTo6svdhIL1cxS4ffGueFpVCF756ip-ab",
          "name": "TikTok Songs 2025",
          "description": "Kishore Kumar was an Indian playback singer and actor.",
          "coverArt": "https://i.ytimg.com/vi/--_0A129T34/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "More Playlists",
      "playlists": [
        {
          "id": "PLNCA1T91UH313UXRVbc-kgLul6PG6qjEJ",
          "name": "Bhojpuri Songs 2025",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/5g0__-cEec4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLWJCstrm0l02WSdUBNcwAR6fJWQIqr5OE",
          "name": "Bhojpuri Songs 2025 songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/Otf9-iRw2pE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gYDJqZoVGvLfY8Fd3gBaZW9",
          "name": "Worldwide Records Bhojpuri",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/3P62-j0w2b4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gZMysByi-wXsMGNCefYqI1_",
          "name": "Worldwide Records Bhojpuri ",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/b4G8IIy1jY0/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gbI0Y8WWkIZFq2WLt1uj-nd",
          "name": "Bhojpuri ",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/u3y8-o4j4gE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLY5D8wTRCsJdrvZb8H48QPKbSvPmrnO_B",
          "name": "Mix Bhojpuri Dj",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/PTi6_x3aT-I/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLqqxLEV7gl8VN3h_RFZEe82AyNgKS_FSB",
          "name": "Old Teth Nagpuri",
          "description": "Romantic songs are songs with lyrics about love and romance.",
          "coverArt": "https://i.ytimg.com/vi/dF169o8p4-c/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    }
];

export const getPlaylistById = async (id: string): Promise<Playlist | undefined> => {
    const allPlaylists = homePagePlaylists.flatMap(section => section.playlists)
        .concat(userPlaylists);
    
    const mockPlaylist = allPlaylists.find(p => p.id === id);
    if(mockPlaylist) return mockPlaylist;
    
    return undefined;
}

export const getTracksForPlaylist = async (playlistId: string): Promise<Track[]> => {
    // For local user-created playlists, just find the tracks from mock-data
    const userPlaylist = userPlaylists.find(p => p.id === playlistId);
    if (userPlaylist) {
        return userPlaylist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
    }
    
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
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
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("NEXT_PUBLIC_YOUTUBE_API_KEY is not set in environment variables.");
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
