# StreamTune

**StreamTune** is a modern, feature-rich music streaming application that leverages the vast library of YouTube to provide a seamless and powerful listening experience across both web and Android. It combines robust playback features with AI-driven discovery tools, community sharing, and deep personalization.

## Key Features

-   **Unlimited Streaming:** Search and stream any song or music video directly from YouTube's extensive catalog.
-   **AI Playlist Generator:** Describe any mood, genre, or vibe, and let our AI craft a personalized playlist for you in seconds.
-   **Advanced YouTube Integration:**
    -   Import any public YouTube playlist directly into your library.
    -   Import entire YouTube channels, which automatically organizes their uploads and public playlists for you.
-   **Community & Sharing:**
    -   Create your own playlists and share them publicly with the StreamTune community.
    -   Discover and explore playlists created by other users.
    -   Share deep links to playlists that open directly inside the native Android app for a seamless experience.
-   **Personalized Experience:**
    -   The app learns from your listening history to provide endless "Recommended For You" tracks.
    -   Select your favorite genres for tailored home page content.
    -   Like songs and manage them in your dedicated "Liked Songs" playlist.
-   **Native Android App:**
    -   **Background Playback:** Keep your music playing even when the app is in the background or your screen is off.
    -   **System Media Controls:** Control playback from your device's lock screen, notification shade, or connected Bluetooth devices.
    -   **Sleep Timer:** Set a timer to automatically stop playback after a set duration.
-   **User & Admin System:**
    -   Full user authentication with email/password and Google Sign-In.
    -   A secure Admin Dashboard to manage users, feature community playlists, and configure app settings.

## Getting Started

### YouTube API Key

This project uses the YouTube Data API v3 to search for music and playlists. To enable this functionality, you must obtain a YouTube API key.

1.  **Go to the Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a new project** or select an existing one.
3.  **Enable the YouTube Data API v3**:
    *   Navigate to "APIs & Services" > "Library".
    *   Search for "YouTube Data API v3" and click "Enable".
4.  **Create Credentials**:
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" and select "API key".
    *   Copy the generated API key.
5.  **Add the key to your environment**:
    *   Create a file named `.env` in the root of your project if it doesn't exist.
    *   Add the following line to your `.env` file, replacing `YOUR_API_KEY` with the key you just copied:
        ```
        YOUTUBE_API_KEY=YOUR_API_KEY
        ```
6.  **Restart your development server** for the new environment variable to be loaded.
