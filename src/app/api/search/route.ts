import { NextResponse } from 'next/server';
import { searchTikTokVideos, getMockTikTokVideos, TikTokSearchParams } from '../../lib/apify';
import { processTikTokVideos } from '../../lib/tiktokUtils';
import { updateVideosCache } from '../../lib/videosCache';

// Environment flag to enable/disable real API calls
const USE_REAL_API = 'true';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required parameters
    if (!body.type) {
      return NextResponse.json({ error: 'Missing required parameter: type' }, { status: 400 });
    }

    // Parse maxItems correctly - ensure it's a number
    const maxItems = body.maxItems ? 
      (typeof body.maxItems === 'string' ? parseInt(body.maxItems, 10) : body.maxItems) : 10;
    
    console.log('Parsed maxItems:', maxItems);

    // Construct payload for Apify
    const searchParams: TikTokSearchParams = {
      type: body.type,
      region: body.region || 'US',
      url: body.url || '',
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      maxItems: maxItems,
      isUnlimited: !!body.isUnlimited,
      sortType: body.sortType || 0,
      publishTime: body.publishTime || 'ALL_TIME'
    };

    console.log('Search parameters:', searchParams);

    let videos;
    
    if (USE_REAL_API) {
      // Use real Apify API
      try {
        const rawVideos = await searchTikTokVideos(searchParams);
        // Process the raw videos to clean up URLs and extract relevant data
        videos = processTikTokVideos(rawVideos);
      } catch (error) {
        console.error('Error calling Apify:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch TikTok videos from Apify', 
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    } else {
      // Use mock data for development
      const rawVideos = await getMockTikTokVideos(searchParams);
      videos = processTikTokVideos(rawVideos);
    }

    // Enforce maxItems limit on the result - this ensures we never return more than requested
    if (videos.length > maxItems) {
      videos = videos.slice(0, maxItems);
    }

    // Update the videos cache with the new videos
    const videosToCache = videos.map(video => ({
      ...video,
      statistics: {
        digg_count: video.statistics.diggCount,
        comment_count: video.statistics.commentCount,
        play_count: video.statistics.playCount,
        share_count: video.statistics.shareCount,
      }
    }));
    await updateVideosCache(videosToCache);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error searching TikTok videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 