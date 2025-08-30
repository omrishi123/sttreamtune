
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## YouTube API Key

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
