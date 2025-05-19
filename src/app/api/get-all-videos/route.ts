import { NextResponse } from 'next/server';
import { getVideosCache, loadVideosFromCache } from '../../lib/videosCache';

export async function GET() {
  try {
    // If we have videos in cache, return them
    let videos = getVideosCache();
    if (videos.length > 0) {
      return NextResponse.json({ videos });
    }
    
    // Try to load from memory cache
    videos = await loadVideosFromCache();
    if (videos.length > 0) {
      return NextResponse.json({ videos });
    }
    
    // If no videos found, return empty array
    return NextResponse.json({ videos: [] });
  } catch (error: unknown) {
    console.error('Error in get-all-videos endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get videos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 