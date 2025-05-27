import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
// In production, this should be stored in environment variables
const APIFY_TOKEN = process.env.NEXT_PUBLIC_APIFY_TOKEN || 'apify_api_OYa1P2lhgPqRss0OpoCwqaYGk5bMrl3f6dfB';
const APIFY_ACTOR_ID = 'novi/fast-tiktok-scraper'; // Using the fast-tiktok-scraper from search results

const client = new ApifyClient({
  token: APIFY_TOKEN,
});

export type TikTokSearchParams = {
  type: 'SEARCH' | 'TREND' | 'HASHTAG' | 'USER' | 'MUSIC';
  region?: string;
  url?: string;
  keywords?: string[];
  maxItems?: number;
  isUnlimited?: boolean;
  sortType?: number;
  publishTime?: string;
};

export type TikTokVideoParams = {
  type: 'VIDEO';
  urls: string[];
  limit?: number;
  isDownloadVideo?: boolean;
  isDownloadVideoCover?: boolean;
};

export async function searchTikTokVideos(params: TikTokSearchParams) {
  try {
    console.log('Running Apify actor with params:', params);
    
    // Run the Actor and wait for it to finish
    const run = await client.actor(APIFY_ACTOR_ID).call(params);
    
    if (!run) {
      throw new Error('Actor run failed');
    }
    
    console.log(`Actor run succeeded with runId: ${run.id}`);
    
    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Retrieved ${items.length} videos from dataset`);
    
    return items;
  } catch (error) {
    console.error('Error in searchTikTokVideos:', error);
    throw error;
  }
}

// Function to fetch individual video data using the Fast TikTok API
export async function fetchTikTokVideo(videoUrl: string) {
  try {
    console.log('Fetching TikTok video:', videoUrl);
    
    // Use the Fast TikTok API actor for individual videos
    const FAST_API_ACTOR_ID = 'novi/fast-tiktok-api';
    
    const params: TikTokVideoParams = {
      type: 'VIDEO',
      urls: [videoUrl],
      limit: 1,
      isDownloadVideo: true,
      isDownloadVideoCover: true
    };
    
    // Run the Actor and wait for it to finish
    const run = await client.actor(FAST_API_ACTOR_ID).call(params);
    
    if (!run) {
      throw new Error('Actor run failed');
    }
    
    console.log(`Actor run succeeded with runId: ${run.id}`);
    
    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      throw new Error('No video data found');
    }
    
    console.log('Retrieved video data successfully');
    
    return items[0];
  } catch (error) {
    console.error('Error in fetchTikTokVideo:', error);
    throw error;
  }
}

// Optional: Add a function for development mode that returns mock data
export async function getMockTikTokVideos(params: TikTokSearchParams) {
  console.log('Getting mock TikTok videos with params:', params);
  
  // Get the requested number of items or default to 10 if not specified
  const maxItems = params.maxItems && typeof params.maxItems === 'number' && params.maxItems > 0 ? 
    params.maxItems : 10;
  
  console.log(`Generating ${maxItems} mock TikTok videos`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock data that matches the structure from Apify
  return Array.from({ length: maxItems }, (_, i) => ({
    id: `video_${i + 1}`,
    desc: `Mock TikTok video about ${params.keywords?.join(', ') || 'trending topics'}`,
    statistics: {
      digg_count: Math.floor(Math.random() * 10000),
      comment_count: Math.floor(Math.random() * 500),
      share_count: Math.floor(Math.random() * 200),
      play_count: Math.floor(Math.random() * 50000),
    },
    author: {
      id: `author_${i}`,
      nickname: `creator_${i}`,
      signature: "TikTok creator",
      verified: Math.random() > 0.8,
    },
    video: {
      cover: {
        url_list: [`https://picsum.photos/seed/${i + 1}/400/600`]
      },
      origin_cover: {
        url_list: [`https://picsum.photos/seed/${i + 100}/400/600`]
      },
      play_addr: {
        url_list: [`https://example.com/video_${i + 1}.mp4`]
      },
      duration: Math.floor(Math.random() * 60) + 10,
    }
  }));
} 