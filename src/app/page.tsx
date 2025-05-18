"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import SearchForm from './components/SearchForm';
import VideoCard from './components/VideoCard';
import Dashboard from './components/Dashboard';
import SemanticClustering from './components/SemanticClustering';
import TranscriptAnalysis from './components/TranscriptAnalysis';

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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clusters' | 'transcript'>('transcript');
  const [transcriptionStatus, setTranscriptionStatus] = useState<{
    inProgress: boolean;
    completed: number;
    total: number;
  }>({
    inProgress: false,
    completed: 0,
    total: 0
  });

  // Function to transcribe all videos
  const transcribeAllVideos = useCallback(async (videosToTranscribe: Video[]) => {
    if (videosToTranscribe.length === 0 || transcriptionStatus.inProgress) return;
    
    setTranscriptionStatus({
      inProgress: true,
      completed: 0,
      total: videosToTranscribe.length
    });
    
    for (let i = 0; i < videosToTranscribe.length; i++) {
      const video = videosToTranscribe[i];
      const videoId = video.id || video.aweme_id;
      
      if (!videoId) continue;
      
      try {
        // First check if this video already has a transcription
        const checkResponse = await fetch(`/api/get-transcript?videoId=${videoId}`);
        if (checkResponse.ok) {
          // Transcription already exists, count as completed
          setTranscriptionStatus(prev => ({
            ...prev,
            completed: prev.completed + 1
          }));
          continue;
        }
        
        // Transcription doesn't exist, call the extraction API
        const response = await fetch('/api/extract-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ video }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Transcription failed for video ${videoId}:`, errorData);
        }
        
        setTranscriptionStatus(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      } catch (error) {
        console.error(`Error transcribing video ${videoId}:`, error);
        
        // Still increment the counter even on error to keep the progress moving
        setTranscriptionStatus(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      }
    }
    
    setTranscriptionStatus(prev => ({
      ...prev,
      inProgress: false
    }));
  }, [transcriptionStatus.inProgress]);

  // When videos are loaded, automatically start transcribing all of them
  useEffect(() => {
    if (videos.length > 0) {
      transcribeAllVideos(videos);
    }
  }, [videos, transcribeAllVideos]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TikTok Semantics Analysis</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Analyze semantic patterns and word usage in TikTok content
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Search Form */}
          <SearchForm onSearch={handleSearch} />
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          
          {/* Transcription Status */}
          {transcriptionStatus.inProgress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Transcribing videos: {transcriptionStatus.completed} of {transcriptionStatus.total}
                </h3>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {Math.round((transcriptionStatus.completed / transcriptionStatus.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(transcriptionStatus.completed / transcriptionStatus.total) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Please wait while we process all videos. This may take a few minutes.
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar with Videos */}
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {videos.length} TikTok Videos
                </h2>
                
                <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-4 pr-1">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelect={setSelectedVideo}
                      isSelected={selectedVideo?.id === video.id}
                    />
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="lg:col-span-9 space-y-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'transcript'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      Transcript Analysis
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'dashboard'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      Semantic Dashboard
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('clusters')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'clusters'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      Semantic Clustering
                    </button>
                  </nav>
                </div>
                
                {/* Content based on active tab */}
                <div className="mt-6">
                  {activeTab === 'dashboard' && (
                    <Dashboard videos={videos} />
                  )}
                  
                  {activeTab === 'clusters' && (
                    <SemanticClustering 
                      videos={videos}
                      selectedCluster={selectedCluster}
                      onSelectCluster={setSelectedCluster}
                    />
                  )}
                  
                  {activeTab === 'transcript' && (
                    <TranscriptAnalysis 
                      video={selectedVideo} 
                      globalTranscriptionInProgress={transcriptionStatus.inProgress}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
