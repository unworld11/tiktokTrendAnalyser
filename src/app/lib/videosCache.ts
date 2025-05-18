import { supabase } from './supabaseClient'; // Import Supabase client
// import fs from 'fs'; // No longer needed for disk operations
// import path from 'path'; // No longer needed for disk operations

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
  
  const filePath = 'data/videos.json'; // Path within the bucket
  try {
    const { error } = await supabase.storage
      .from('temporary_files')
      .upload(filePath, JSON.stringify({ videos }, null, 2), {
        contentType: 'application/json',
        upsert: true, // Create or update if exists
      });

    if (error) {
      console.error('Error saving videos to Supabase Storage:', error);
      throw error;
    }
    console.log('Videos saved to Supabase Storage successfully.');
  } catch (error) {
    console.error('Error in updateVideosCache during Supabase operation:', error);
  }
}

// Renamed from loadVideosFromDisk
export async function loadVideosFromSupabase(): Promise<Video[]> {
  const filePath = 'data/videos.json'; // Path within the bucket
  try {
    const { data, error } = await supabase.storage
      .from('temporary_files')
      .download(filePath);

    if (error) {
      if (error.message.includes('The resource was not found')) {
        console.log('videos.json not found in Supabase Storage, returning empty array.');
        cachedVideos = [];
        return [];
      }
      console.error('Error downloading videos from Supabase Storage:', error);
      throw error;
    }

    if (data) {
      const videosData = JSON.parse(await data.text());
      cachedVideos = videosData.videos || [];
      console.log('Videos loaded from Supabase Storage successfully.');
      return cachedVideos;
    }
  } catch (error) {
    console.error('Error in loadVideosFromSupabase:', error);
  }
  
  cachedVideos = []; // Ensure cache is cleared if there's an issue
  return [];
} 