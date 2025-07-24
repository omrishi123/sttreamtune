
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
          "name": "Trending Songs",
          "description": "Listen to all the trending songs of the week in this playlist!",
          "coverArt": "https://i.ytimg.com/vi/l1EssSA_G9I/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        },
        {
          "id": "PLO7-VO1D0_6NmK47v6tpOcxurcxdW-hZa",
          "name": "Trending Songs",
          "description": "Trending songs are the most popular songs that are being listened to by a large number of people. These songs often have a catchy beat and a memorable melody. Many trending songs are also accompanied by a music video that helps to promote the song.",
          "coverArt": "https://i.ytimg.com/vi/D16c02aG6v8/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
        },
        {
          "id": "PL9bw4S5ePsEGrOA88bJtxgfKaN2HPhkNS",
          "name": "Bollywood Top 50",
          "description": "Presenting the Top 50 songs of the week for all the Bollywood fans. Hit the play button and enjoy these superhit tracks of the week.",
          "coverArt": "https://i.ytimg.com/vi/k3g_WjLCsXM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        }
      ]
    },
    {
      "title": "Devotional",
      "playlists": [
        {
          "id": "PLO7-VO1D0_6MnOoKQGmYNY2OoCOP3GRfm",
          "name": "Ram Bhajans",
          "description": "Ram is a major deity in Hinduism. He is the seventh avatar of the god Vishnu, one of his most popular incarnations along with Krishna, Parshurama, and Gautama Buddha. In Rama-centric traditions of Hinduism, he is considered the Supreme Being.",
          "coverArt": "https://i.ytimg.com/vi/M36y8-k32vA/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
        },
        {
          "id": "PL9bw4S5ePsEF-J_tIORZ6xE_OXkGuKjjY",
          "name": "Hanuman Bhajans",
          "description": "Hanuman is a Hindu god and a divine vanara companion of the god Rama. Hanuman is one of the central characters of the Hindu epic Ramayana. He is an ardent devotee of Rama and one of the chiranjivis. ",
          "coverArt": "https://i.ytimg.com/vi/G84_-P4O0vE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        },
        {
          "id": "PLO7-VO1D0_6M1xUjj8HxTxskouWx48SNw",
          "name": "Shiv Bhajans",
          "description": "Shiva is one of the principal deities of Hinduism. He is the Supreme Being in Shaivism, one of the major traditions within Hinduism. Shiva is known as the 'destroyer' within the Trimurti, the Hindu trinity that includes Brahma and Vishnu.",
          "coverArt": "https://i.ytimg.com/vi/Q23ANvH_C7k/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
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
          "coverArt": "https://i.ytimg.com/vi/Gqz5-0d_mS4/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Filmi Gaane"
        },
        {
          "id": "PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv",
          "name": "Bollywood Unforgettable Love Songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/AEIVhbfka_s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Ishtar Music"
        },
        {
          "id": "PLO7-VO1D0_6NYoMAN0XncJu4tvibirSmN",
          "name": "Bollywood Sad Songs",
          "description": "Sad songs are songs that make you feel sad. They can be about anything from a break-up to the death of a loved one. Sad songs can be a great way to deal with your emotions and can help you to feel better.",
          "coverArt": "https://i.ytimg.com/vi/U66H-T2t2aM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
        }
      ]
    },
    {
      "title": "Featured Playlists",
      "playlists": [
        {
          "id": "PLEK4199_zBwCqNxwJygffUonzfROKn0Kh",
          "name": "Lofi Flip",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/cbuZ9S-f_2s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Lofi Girl"
        },
        {
          "id": "PLf0EVMk_zZgYD7bfe6KDmRtf58M9EjOEn",
          "name": "Bhojpuri Songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/6nQNIyK2b8I/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Ankush Raja"
        },
        {
          "id": "PLNCA1T91UH31M7mN8iKSxMwwWB_mkzwT6",
          "name": "Punjabi Songs",
          "description": "Punjabi songs are the most popular songs in India. They are known for their catchy beats and memorable melodies. Punjabi songs are also popular in other countries, such as the United States, Canada, and the United Kingdom.",
          "coverArt": "https://i.ytimg.com/vi/ebrAk0hEk24/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Jass Records"
        },
        {
          "id": "PLmfcCDSUSykbw9ewtVgSDKazPDwoTBm8E",
          "name": "Marathi Songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/B49m8dfroME/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Everest Marathi"
        },
        {
          "id": "PLdYKFelfD72exdwCQ6XzPzJDvc91tCpKm",
          "name": "Romantic Songs",
          "description": "A playlist of romantic songs from Bollywood.",
          "coverArt": "https://i.ytimg.com/vi/AEIVhbfka_s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        },
        {
          "id": "PLyORnIW1xT6xk8134gbFnvDrD6mXiIlrF",
          "name": "Pop",
          "description": "Pop music is a genre of popular music that originated in its modern form during the mid-1950s in the United States and the United Kingdom. During the 1950s and 1960s, pop music encompassed rock and roll and the youth-oriented styles it influenced. ",
          "coverArt": "https://i.ytimg.com/vi/U66H-T2t2aM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Pop"
        }
      ]
    },
    {
      "title": "Artist Mixes",
      "playlists": [
        {
          "id": "PL-oM5qTjmK2vxdTsj2Xghu5fjxhtuMaxo",
          "name": "Arijit Singh",
          "description": "Arijit Singh is an Indian singer and music composer. He sings predominantly in Hindi and Bengali but has also performed in various other Indian languages. He is the recipient of a National Award and six Filmfare Awards.",
          "coverArt": "https://i.ytimg.com/vi/AEIVhbfka_s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Arijit Singh"
        },
        {
          "id": "PLFFyMei_d85XaYHYUy8gFt_TQ7LqBNgEv",
          "name": "Neha Kakkar",
          "description": "Neha Kakkar Singh is an Indian singer. She is the younger sister of playback singer Sonu Kakkar. She began performing at a very early age at religious events. In 2005, she participated in the second season of the singing reality show, Indian Idol.",
          "coverArt": "https://i.ytimg.com/vi/k3g_WjLCsXM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Neha Kakkar"
        },
        {
          "id": "PLFFyMei_d85X5UuHRCJ63jcl84x--WGLu",
          "name": "Jubin Nautiyal",
          "description": "Jubin Nautiyal is an Indian playback singer and performer. In June 2022, he won the IIFA award for “Playback Singer (Male)” for the song 'Raataan Lambiyan'. He was awarded Upcoming Male Vocalist of the Year at 8th Mirchi Music Awards for his song 'Zindagi Kuch Toh Bata (Reprise)' from Bajrangi Bhaijaan.",
          "coverArt": "https://i.ytimg.com/vi/k3g_WjLCsXM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Jubin Nautiyal"
        },
        {
          "id": "PLO7-VO1D0_6N2ePPlPE9NKCgUBA15aOk2",
          "name": "Sonu Nigam",
          "description": "Sonu Nigam is an Indian singer, music director and actor. He has been described in the media as one of the most popular and successful playback singers of Hindi Cinema. He sings predominantly in Hindi and Kannada language films but has also sung in English, Bengali, Manipuri, Gujarati, Tamil, Telugu, Marathi, Tulu, Assamese, Odia, Nepali, Maithili, Malayalam and various other Indian languages.",
          "coverArt": "https://i.ytimg.com/vi/U66H-T2t2aM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Sonu Nigam"
        },
        {
          "id": "PLDIoUOhQQPlXzhp-83rECoLaV6BwFtNC4",
          "name": "Lata Mangeshkar",
          "description": "Lata Mangeshkar was an Indian playback singer and occasional music composer. She is widely considered to have been one of the greatest and most influential singers in India. Her contribution to the Indian music industry in a career spanning eight decades gained her honorific titles such as the 'Queen of Melody', 'Nightingale of India', and 'Voice of the Millennium'.",
          "coverArt": "https://i.ytimg.com/vi/AEIVhbfka_s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Lata Mangeshkar"
        },
        {
          "id": "PLTo6svdhIL1cxS4ffGueFpVCF756ip-ab",
          "name": "Kishore Kumar",
          "description": "Kishore Kumar was an Indian playback singer and actor. He is widely regarded as one of the greatest and most dynamic singers in the history of Indian music. He was one of the most popular singers in the Indian subcontinent, notable for his yodeling and ability to sing songs in different voices. ",
          "coverArt": "https://i.ytimg.com/vi/U66H-T2t2aM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Kishore Kumar"
        }
      ]
    },
    {
      "title": "More Playlists",
      "playlists": [
        {
          "id": "PLNCA1T91UH313UXRVbc-kgLul6PG6qjEJ",
          "name": "Sad songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/ebrAk0hEk24/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Jass Records"
        },
        {
          "id": "PLWJCstrm0l02WSdUBNcwAR6fJWQIqr5OE",
          "name": "Party songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/6nQNIyK2b8I/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Ankush Raja"
        },
        {
          "id": "PLJ3M6AoVR-gYDJqZoVGvLfY8Fd3gBaZW9",
          "name": "Old Songs",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/AEIVhbfka_s/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Ishtar Music"
        },
        {
          "id": "PLJ3M6AoVR-gZMysByi-wXsMGNCefYqI1_",
          "name": "Workout",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/U66H-T2t2aM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
        },
        {
          "id": "PLJ3M6AoVR-gbI0Y8WWkIZFq2WLt1uj-nd",
          "name": "Shree Krishna",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/Q23ANvH_C7k/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "JioSaavn"
        },
        {
          "id": "PLY5D8wTRCsJdrvZb8H48QPKbSvPmrnO_B",
          "name": "Ghazal",
          "description": "",
          "coverArt": "https://i.ytimg.com/vi/G84_-P4O0vE/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        },
        {
          "id": "PLqqxLEV7gl8VN3h_RFZEe82AyNgKS_FSB",
          "name": "Romantic",
          "description": "Romantic songs are songs with lyrics about love and romance. They are often slow and emotional, and they can be about any aspect of love, from the first flush of infatuation to the pain of a broken heart.",
          "coverArt": "https://i.ytimg.com/vi/k3g_WjLCsXM/hqdefault.jpg",
          "trackIds": [],
          "public": true,
          "owner": "Romantic"
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

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.append('part', 'snippet,contentDetails');
    url.searchParams.append('playlistId', playlistId);
    url.searchParams.append('key', apiKey);
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
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
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
