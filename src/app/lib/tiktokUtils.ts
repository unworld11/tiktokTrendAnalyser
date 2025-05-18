/**
 * Utility functions for handling TikTok API data
 */

export type TikTokImageData = {
  uri?: string;
  url_list?: string[];
  height?: number;
  width?: number;
};

type RawTikTokVideo = {
  aweme_id?: string;
  id?: string;  // Some APIs return id instead of aweme_id
  desc?: string;
  video?: {
    cover?: TikTokImageData;
    origin_cover?: TikTokImageData;
    play_addr?: TikTokImageData;
    duration?: number;
  };
  author?: {
    uid?: string;
    id?: string;  // Some APIs return id instead of uid
    nickname?: string;
    avatar_medium?: TikTokImageData;
  };
  statistics?: {
    digg_count?: number;
    comment_count?: number;
    play_count?: number;
    share_count?: number;
  };
};

export interface ProcessedTikTokVideo {
  id: string;
  desc: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  statistics: {
    diggCount: number;
    commentCount: number;
    playCount: number;
    shareCount: number;
  };
  coverImage: string;
  videoUrl: string;
  duration: number;
}

/**
 * Gets the first valid URL from a TikTok image data object
 */
export function getImageUrl(imageData: TikTokImageData | null | undefined): string {
  if (!imageData || !imageData.url_list || imageData.url_list.length === 0) {
    return '';
  }
  
  // Filter out null/undefined and clean up URL strings
  const validUrls = imageData.url_list
    .filter(url => !!url)
    .map(url => {
      // Remove any markdown-like formatting that might be in the URL
      return url.replace(/^\[|\]$/g, '').replace(/\]\(|\)$/g, '');
    });
  
  return validUrls[0] || '';
}

/**
 * Process raw TikTok video data into a simplified format
 */
export function processTikTokVideo(rawData: RawTikTokVideo): ProcessedTikTokVideo | null {
  if (!rawData || (!rawData.aweme_id && !rawData.id)) {
    return null;
  }
  
  try {
    // Get cover image
    let coverImage = '';
    if (rawData.video && rawData.video.cover && rawData.video.cover.url_list) {
      coverImage = getImageUrl(rawData.video.cover);
    } else if (rawData.video && rawData.video.origin_cover && rawData.video.origin_cover.url_list) {
      coverImage = getImageUrl(rawData.video.origin_cover);
    }
    
    // Get video URL
    let videoUrl = '';
    if (rawData.video && rawData.video.play_addr && rawData.video.play_addr.url_list) {
      videoUrl = getImageUrl(rawData.video.play_addr);
    }
    
    // Get author avatar
    let authorAvatar = '';
    if (rawData.author && rawData.author.avatar_medium) {
      authorAvatar = getImageUrl(rawData.author.avatar_medium);
    }
    
    return {
      id: rawData.aweme_id || rawData.id || '',
      desc: rawData.desc || '',
      author: {
        id: rawData.author?.uid || rawData.author?.id || '',
        nickname: rawData.author?.nickname || '',
        avatar: authorAvatar
      },
      statistics: {
        diggCount: rawData.statistics?.digg_count || 0,
        commentCount: rawData.statistics?.comment_count || 0,
        playCount: rawData.statistics?.play_count || 0,
        shareCount: rawData.statistics?.share_count || 0
      },
      coverImage,
      videoUrl,
      duration: rawData.video?.duration || 0
    };
  } catch (error) {
    console.error('Error processing TikTok video data:', error);
    return null;
  }
}

/**
 * Process an array of TikTok videos
 */
export function processTikTokVideos(rawVideos: RawTikTokVideo[]): ProcessedTikTokVideo[] {
  if (!Array.isArray(rawVideos)) {
    return [];
  }
  
  return rawVideos
    .map(video => processTikTokVideo(video))
    .filter(video => video !== null) as ProcessedTikTokVideo[];
} 