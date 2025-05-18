import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { getImageUrl, type TikTokImageData } from './tiktokUtils';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Extract audio from a TikTok video URL
 * 
 * @param videoUrl The TikTok video URL or MP4 URL
 * @param videoId Unique ID for the video for temporary file naming
 * @returns A buffer containing the audio data
 */
export async function extractAudioFromVideo(videoUrl: string, videoId: string): Promise<Buffer> {
  try {
    // Create a temporary directory for our files
    const tempDir = os.tmpdir();
    const videoFilePath = path.join(tempDir, `tiktok_${videoId}.mp4`);
    const audioFilePath = path.join(tempDir, `tiktok_${videoId}.mp3`);
    
    console.log(`Downloading video from: ${videoUrl}`);
    
    // Download the video file
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'arraybuffer',
    });
    
    // Write the video file to disk
    await writeFileAsync(videoFilePath, Buffer.from(response.data));
    
    console.log(`Video downloaded to: ${videoFilePath}`);
    
    // Use ffmpeg to extract audio
    return new Promise((resolve, reject) => {
      // FFmpeg command to extract audio - use system ffmpeg instead of the module
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoFilePath,
        '-q:a', '0',
        '-map', 'a',
        '-f', 'mp3',
        audioFilePath
      ]);
      
      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });
      
      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg process exited with code ${code}`));
          return;
        }
        
        try {
          // Read the audio file
          const audioData = fs.readFileSync(audioFilePath);
          
          // Clean up temporary files
          await unlinkAsync(videoFilePath);
          await unlinkAsync(audioFilePath);
          
          resolve(audioData);
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  }
}

// Define the VideoData type to represent the various structures
// that extractVideoUrl can handle.
export type VideoData = (
  {
    id?: string; // Used in the calling context (extract-audio/route.ts)
    aweme_id?: string; // Used in the calling context (extract-audio/route.ts)
    video?: {
      bit_rate?: Array<{
        play_addr?: TikTokImageData;
        bit_rate?: number; 
        // Other properties within bit_rate objects if they exist
      }>;
      play_addr?: TikTokImageData;
      download_addr?: TikTokImageData;
      // Include other fields from RawTikTokVideo/ProcessedTikTokVideo if necessary
    };
    videoUrl?: string; // Field from ProcessedTikTokVideo
    // Include other top-level fields from RawTikTokVideo/ProcessedTikTokVideo if necessary
  } |
  string // To handle the case where video itself is a URL string
);

/**
 * Extracts the best video URL from a TikTok video object
 */
export function extractVideoUrl(video: VideoData): string | null {
  try {
    // Handle different possible data structures from TikTok API
    if (!video) {
      return null;
    }
    
    // Case 5: If we have a direct URL string, handle this first
    if (typeof video === 'string') {
      if (video.includes('http://') || video.includes('https://')) {
        return video; // It's a valid URL string
      }
      // If it's a string but not a recognized URL, we can't extract a video URL from it.
      console.error('VideoData is a string but not a recognized HTTP/HTTPS URL:', video);
      return null;
    }

    // If we reach here, TypeScript knows 'video' is the object part of the VideoData union.
    // Now, 'video.video' and 'video.videoUrl' are safe to access.

    // Case 1: Apify format with bit_rate array
    if (video.video && Array.isArray(video.video.bit_rate)) {
      // Sort bit rates to get the highest quality version
      const sortedBitRates = [...video.video.bit_rate].sort((a, b) => {
        const qualityA = a.bit_rate || 0;
        const qualityB = b.bit_rate || 0;
        return qualityB - qualityA; // Sort from highest to lowest quality
      });
      
      // Get the URL from the highest quality version
      if (sortedBitRates.length > 0 && sortedBitRates[0].play_addr) {
        return getImageUrl(sortedBitRates[0].play_addr);
      }
    }
    
    // Case 2: Direct play_addr in video object
    if (video.video && video.video.play_addr) {
      return getImageUrl(video.video.play_addr);
    }
    
    // Case 3: Already processed format with videoUrl field
    if (video.videoUrl) {
      return video.videoUrl;
    }
    
    // Case 4: Try to find download_addr
    if (video.video && video.video.download_addr) {
      return getImageUrl(video.video.download_addr);
    }
    
    // If none of the object properties yielded a URL
    console.error('Could not find video URL in TikTok data structure (object type):', 
      JSON.stringify(video.video ? { 
        has_play_addr: !!video.video.play_addr,
        has_download_addr: !!video.video.download_addr,
        has_bit_rate: !!video.video.bit_rate,
      } : 'No video field in object', null, 2));
    
    return null; // Default if no URL found in the object

  } catch (error) {
    console.error('Error extracting video URL:', error);
    return null;
  }
} 