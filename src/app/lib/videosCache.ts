import fs from 'fs';
import path from 'path';

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
export function updateVideosCache(videos: Video[]): void {
  cachedVideos = videos;
  
  // Also save to disk for persistence between server restarts
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const videosFilePath = path.join(dataDir, 'videos.json');
    fs.writeFileSync(videosFilePath, JSON.stringify({ videos }, null, 2));
  } catch (error) {
    console.error('Error saving videos to disk:', error);
  }
}

// Load videos from disk file
export function loadVideosFromDisk(): Video[] {
  try {
    const videosFilePath = path.join(process.cwd(), 'public', 'data', 'videos.json');
    
    if (fs.existsSync(videosFilePath)) {
      const videosData = JSON.parse(fs.readFileSync(videosFilePath, 'utf-8'));
      cachedVideos = videosData.videos || [];
      return cachedVideos;
    }
  } catch (error) {
    console.error('Error reading videos file:', error);
  }
  
  return [];
} 