import Image from 'next/image';
import { useState } from 'react';
import { getImageUrl, type TikTokImageData } from '../lib/tiktokUtils';

type Video = {
  desc?: string;
  statistics?: {
    digg_count: number;
    comment_count: number;
    share_count: number;
    play_count: number;
  };
  author?: {
    nickname: string;
  };
  video?: {
    cover?: TikTokImageData;
    origin_cover?: TikTokImageData;
  };
  id?: string;
  aweme_id?: string;
};

type VideoCardProps = {
  video: Video;
  onSelect: (video: Video) => void;
  isSelected: boolean;
};

export default function VideoCard({ video, onSelect, isSelected }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Extract the relevant information from the video object
  const {
    desc = '',
    statistics = { digg_count: 0, comment_count: 0, share_count: 0, play_count: 0 },
    author = { nickname: 'Unknown' },
  } = video || {};
  
  const authorName = author.nickname;
  
  // Use the utility function to get a clean image URL
  const coverImage = video?.video?.cover 
    ? getImageUrl(video.video.cover) 
    : video?.video?.origin_cover 
      ? getImageUrl(video.video.origin_cover) 
      : '';
  
  const likesCount = statistics.digg_count || 0;
  const commentsCount = statistics.comment_count || 0;
  const sharesCount = statistics.share_count || 0;
  const viewsCount = statistics.play_count || 0;
  
  // Truncate description if too long
  const truncatedDesc = desc.length > 100 ? `${desc.substring(0, 100)}...` : desc;
  
  return (
    <div 
      className={`w-full border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow 
        ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={() => onSelect(video)}
    >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
        {!imageError && coverImage ? (
          <Image
            src={coverImage}
            alt={truncatedDesc || 'TikTok video'}
            fill
            style={{ objectFit: 'cover' }}
            onError={() => setImageError(true)}
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">No preview available</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          @{authorName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
          {truncatedDesc || 'No description'}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="material-icons text-base">favorite</span>
            <span>{likesCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-base">comment</span>
            <span>{commentsCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-base">share</span>
            <span>{sharesCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-base">visibility</span>
            <span>{viewsCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 