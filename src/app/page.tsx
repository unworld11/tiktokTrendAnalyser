"use client";

import { useState } from 'react';
import SearchForm from './components/SearchForm';
import ThemeToggle from './components/ThemeToggle';
import BatchAnalysis from './components/BatchAnalysis';

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

type SearchParams = {
  type: 'SEARCH' | 'TREND' | 'HASHTAG' | 'USER' | 'MUSIC';
  region: string;
  url: string;
  keywords: string[];
  maxItems: number;
  isUnlimited: boolean;
  sortType: number;
  publishTime: 'ALL_TIME' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'THREE_MONTH' | 'SIX_MONTH';
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    setError(null);
    setVideos([]);
    setSelectedVideo(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search TikTok videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (err) {
      console.error('Error searching videos:', err);
      setError('Failed to search TikTok videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative text-center mb-8">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">TikTok Semantics Analysis</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Analyze semantic patterns and word usage in TikTok content
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Search Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <SearchForm onSearch={handleSearch} />
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-5 text-red-700 dark:text-red-400 shadow-sm">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Searching TikTok videos...</p>
              </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-1 lg:items-start">
              {/* Sidebar with Videos */}
              {/* Main Content */}
              <div className={`w-full min-w-0 lg:col-span-${videos.length > 0 ? '9' : '12'} space-y-6`}>
                {/* Batch Analysis occupies the full width without nested outer tabs */}
                <BatchAnalysis videos={videos} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
