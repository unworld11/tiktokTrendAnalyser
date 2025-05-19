// We now only use in-memory cache since we're directly analyzing video URLs

type Video = {
  id?: string;
  aweme_id?: string;
  desc?: string;
  video?: {
    cover?: {
      url_list?: string[];
    };
    origin_cover?: {
      url_list?: string[];
    };
  };
  author?: {
    nickname?: string;
  };
  statistics?: {
    digg_count?: number;
    comment_count?: number;
    play_count?: number;
    share_count?: number;
  };
};

// Store in-memory cache of videos
let cachedVideos: Video[] = [];

// Get the videos from cache
export function getVideosCache(): Video[] {
  return cachedVideos;
}

// Update the videos cache
export async function updateVideosCache(videos: Video[]): Promise<void> {
  cachedVideos = videos;
  console.log('Videos cached in memory successfully.');
}

// Load videos from cache (for API compatibility)
export async function loadVideosFromCache(): Promise<Video[]> {
  return cachedVideos;
} 