
import type { Track, Playlist } from './types';

export const tracks: Track[] = [
  { id: '1', youtubeVideoId: 'dQw4w9WgXcQ', title: 'Starlight Serenade', artist: 'Cosmic Echoes', album: 'Celestial Dreams', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 210, 'data-ai-hint': 'album cover' },
  { id: '2', youtubeVideoId: 'o-YBDTqX_ZU', title: 'Oceanic Whispers', artist: 'Tidal Waves', album: 'Deep Blue', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 245, 'data-ai-hint': 'ocean wave' },
  { id: '3', youtubeVideoId: '3tmd-ClpJxA', title: 'City of Neon', artist: 'Synth Riders', album: 'Nightfall', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 180, 'data-ai-hint': 'neon city' },
  { id: '4', youtubeVideoId: '9bZkp7q19f0', title: 'Forest Lullaby', artist: 'Earthen Tune', album: 'Whispering Woods', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 270, 'data-ai-hint': 'mystical forest' },
  { id: '5', youtubeVideoId: 'hY7m5jjJ9e4', title: 'Desert Mirage', artist: 'Sand Drifters', album: 'Golden Dunes', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 195, 'data-ai-hint': 'vast desert' },
  { id: '6', youtubeVideoId: 'pA-u_1P63_s', title: 'Mountain Echo', artist: 'Peak Harmonix', album: 'Summit Songs', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 220, 'data-ai-hint': 'snowy mountain' },
  { id: '7', youtubeVideoId: 'I1S_fkI_3r4', title: 'Retro Groove', artist: 'The Funkalistics', album: 'Vinyl Days', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 188, 'data-ai-hint': 'retro vinyl' },
  { id: '8', youtubeVideoId: 'k4yXQkG2s1E', title: 'Future Pulse', artist: 'Chrono Beats', album: 'Time Warp', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 205, 'data-ai-hint': 'futuristic abstract' },
  { id: '9', youtubeVideoId: 'F1B9Fk_SgI0', title: 'Island Rhythm', artist: 'Reggae Roots', album: 'Sun-Kissed', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 230, 'data-ai-hint': 'tropical island' },
  { id: '10', youtubeVideoId: 'MVbeo_o23Mk', title: 'Midnight Jazz', artist: 'The Night Owls', album: 'After Hours', artwork: 'https://i.postimg.cc/SswWC87w/streamtune.png', duration: 300, 'data-ai-hint': 'jazz club' },
];

export const playlists: Playlist[] = [
  { id: 'pl-1', name: 'Workout Hits', description: 'High-energy tracks to keep you motivated.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['3', '7', '8'], public: true, owner: 'StreamTune', 'data-ai-hint': 'gym workout' },
  { id: 'pl-2', name: 'Chill Focus', description: 'Instrumental beats for concentration.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['2', '4', '10'], public: true, owner: 'StreamTune', 'data-ai-hint': 'person studying' },
  { id: 'pl-3', name: 'Top 100', description: 'The most popular tracks right now.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], public: true, owner: 'StreamTune', 'data-ai-hint': 'music chart' },
  { id: 'pl-4', name: 'Cosmic Dreams', description: 'Embark on a journey through sound.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['1', '8'], public: true, owner: 'StreamTune', 'data-ai-hint': 'galaxy stars' },
  { id: 'pl-5', name: 'Nature Walk', description: 'Calm and soothing sounds of nature.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['2', '4', '6', '9'], public: true, owner: 'StreamTune', 'data-ai-hint': 'forest path' },
  { id: 'pl-6', name: 'Liked Songs', description: 'Your collection of favorite tracks.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['1', '5', '9'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'glowing heart' },
  { id: 'pl-7', name: 'My Roadtrip', description: 'Songs for the open road.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['3', '5', '7'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'car roadtrip' },
  { id: 'pl-8', name: 'Morning Coffee', description: 'Acoustic and mellow tunes.', coverArt: 'https://i.postimg.cc/SswWC87w/streamtune.png', trackIds: ['4', '10'], public: false, owner: 'Jane Doe', 'data-ai-hint': 'morning coffee' },
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6NmK47v6tpOcxurcxdW-hZa",
          "name": "Latest Bollywood Songs 2025",
          "description": "Trending songs are the most popular songs that are being listened to by a large number of people.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL9bw4S5ePsEGrOA88bJtxgfKaN2HPhkNS",
          "name": "Bollywood Top 50",
          "description": "Presenting the Top 50 songs of the week for all the Bollywood fans.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL9bw4S5ePsEF-J_tIORZ6xE_OXkGuKjjY",
          "name": "Party Songs",
          "description": "Hanuman is a Hindu god and a divine vanara companion of the god Rama.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6M1xUjj8HxTxskouWx48SNw",
          "name": "Bollywood Songs ",
          "description": "Shiva is one of the principal deities of Hinduism.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv",
          "name": "Spotify Playlist",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6NYoMAN0XncJu4tvibirSmN",
          "name": "Punjabi Song Playlist",
          "description": "Sad songs are songs that make you feel sad.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLf0EVMk_zZgYD7bfe6KDmRtf58M9EjOEn",
          "name": "Punjabi Hits SPOTIFY",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLNCA1T91UH31M7mN8iKSxMwwWB_mkzwT6",
          "name": "Punjabi Songs",
          "description": "Punjabi songs are the most popular songs in India.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLmfcCDSUSykbw9ewtVgSDKazPDwoTBm8E",
          "name": "Punjabi Hits",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLdYKFelfD72exdwCQ6XzPzJDvc91tCpKm",
          "name": "Romantic Songs PUNJABI",
          "description": "A playlist of romantic songs from Bollywood.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLyORnIW1xT6xk8134gbFnvDrD6mXiIlrF",
          "name": "Pop",
          "description": "Pop music is a genre of popular music that originated in its modern form during the mid-1950s in the United States and the United Kingdom.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLFFyMei_d85XaYHYUy8gFt_TQ7LqBNgEv",
          "name": " Punjabi Songs 2025 ",
          "description": "Neha Kakkar Singh is an Indian singer.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLFFyMei_d85X5UuHRCJ63jcl84x--WGLu",
          "name": "PUNJABI HITS",
          "description": "Jubin Nautiyal is an Indian playback singer and performer.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLO7-VO1D0_6N2ePPlPE9NKCgUBA15aOk2",
          "name": "English Songs",
          "description": "Sonu Nigam is an Indian singer, music director and actor.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLDIoUOhQQPlXzhp-83rECoLaV6BwFtNC4",
          "name": "English Songs",
          "description": "Lata Mangeshkar was an Indian playback singer and occasional music composer.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLTo6svdhIL1cxS4ffGueFpVCF756ip-ab",
          "name": "TikTok Songs 2025",
          "description": "Kishore Kumar was an Indian playback singer and actor.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        }
      ]
    },
    {
      "title": "Bhakti Songs",
      "playlists": [
        {
          "id": "PL9bw4S5ePsEE0jGfUgUMvzeWAaMPcqHL9",
          "name": "Nonstop Ram Bhajans",
          "description": "Listen to all the trending songs of the week in this playlist!",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "T-Series Bhakti Sagar"
        },
        {
          "id": "PLFPJRCFRDARRXCaWKpL5tuyWzz_B_ntwE",
          "name": "Shree Krishna Govind",
          "description": "Shree Krishna Govind Hare Murari.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Jubin Nautiyal"
        },
        {
          "id": "PL2iMjy7LPXAGbh13EK99NSka47D4Vu2bt",
          "name": "Hanuman Chalisa",
          "description": "Hanuman is a Hindu god and a divine vanara companion of the god Rama.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "T-Series Bhakti Sagar"
        },
        {
          "id": "PL20B425742CB4BCCD",
          "name": "Top Krishna Bhajans",
          "description": "The best bhajans dedicated to Lord Krishna.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Art of Living"
        },
        {
          "id": "PLyXHXSHxLqKxWA9_JhSjMpXQabvHBvzis",
          "name": "Sunderkand Path",
          "description": "Musical rendition of the Sunderkand.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Shemaroo Bhakti"
        },
        {
          "id": "PL109z4jBDfVksX38sA3le--iT-JzfBNcw",
          "name": "Shiv Bhajans",
          "description": "Devotional songs for Lord Shiva.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Shemaroo Bhakti"
        },
        {
          "id": "PLIdZRpy-6dcVeLLaxMkQbvaFXQlKugMhH",
          "name": "Ganesh Bhajans",
          "description": "A collection of devotional songs for Lord Ganesha.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Shemaroo Bhakti"
        },
      ]
    },
    {
      "title": "Patriotic Songs of Nation",
      "playlists": [
        {
          "id": "PL0Z67tlyTaWo-c_QyUnhsoa4cUwceCmRu",
          "name": "Independence Day Special",
          "description": "Patriotic songs to celebrate the spirit of the nation.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        },
        {
          "id": "PLtp23GqaHmiAJgvaHYI3UULaqgcVOKwNd",
          "name": "Best Patriotic Songs",
          "description": "A collection of the most popular patriotic songs.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "Various Artists"
        },
        {
          "id": "PL9bw4S5ePsEHil8ve8D0fRLf4ewqZ6hNZ",
          "name": "Top Indian Patriotic Songs",
          "description": "Feel the pride with these top patriotic songs from India.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "T-Series"
        }
      ]
    },
     {
      "title": "Shri Mad Bhagwat Gita",
      "playlists": [
        {
          "id": "PL5A5QJkW7MkvYslAbg7_rFij8yVEeiEwF",
          "name": "Shrimad Bhagavad Gita",
          "description": "Listen to all chapters of the sacred scripture.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "GEETHANJALI"
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
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLWJCstrm0l02WSdUBNcwAR6fJWQIqr5OE",
          "name": "Bhojpuri Songs 2025 songs",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gYDJqZoVGvLfY8Fd3gBaZW9",
          "name": "Worldwide Records Bhojpuri",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gZMysByi-wXsMGNCefYqI1_",
          "name": "Worldwide Records Bhojpuri ",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLJ3M6AoVR-gbI0Y8WWkIZFq2WLt1uj-nd",
          "name": "Bhojpuri ",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLY5D8wTRCsJdrvZb8H48QPKbSvPmrnO_B",
          "name": "Mix Bhojpuri Dj",
          "description": "",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
          "trackIds": [],
          "public": true,
          "owner": "OM RISHI"
        },
        {
          "id": "PLqqxLEV7gl8VN3h_RFZEe82AyNgKS_FSB",
          "name": "Old Teth Nagpuri",
          "description": "Romantic songs are songs with lyrics about love and romance.",
          "coverArt": "https://i.postimg.cc/SswWC87w/streamtune.png",
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
