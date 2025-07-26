
import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId query parameter is required' }, { status: 400 });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Add request options to mimic a browser, which can help prevent getting blocked.
    const requestOptions = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        }
    };

    const info = await ytdl.getInfo(videoUrl, { requestOptions });
    
    // Find the best audio-only format
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (!audioFormat) {
      return NextResponse.json({ error: 'No suitable audio format found for this video.' }, { status: 404 });
    }

    return NextResponse.json({ 
      audioUrl: audioFormat.url,
      title: info.videoDetails.title,
      artist: info.videoDetails.author.name
    });

  } catch (error: any) {
    console.error(`[YTDL-ERROR] Failed to fetch info for videoId ${videoId}:`, error);
    return NextResponse.json({ 
      error: 'Failed to get audio stream from YouTube.',
      details: error.message 
    }, { status: 500 });
  }
}
