import { useState, useEffect } from 'react';

type Video = {
  id?: string;
  aweme_id?: string;
  desc?: string;
};

type DashboardProps = {
  videos: Video[];
};

type WordUsageStats = {
  word: string;
  count: number;
  videos: number;
};

type SemanticCluster = {
  name: string;
  keywords: string[];
  videoCount: number;
  topVideos: string[];
};

export default function Dashboard({ videos }: DashboardProps) {
  const [loading, setLoading] = useState(false);

  // Show a message if no videos are available for analysis
  if (videos.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Search for TikTok videos to see semantic analysis
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white">TikTok Semantic Analysis</h3>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Videos</h4>
                <p className="text-3xl font-semibold text-gray-800 dark:text-white">{videos.length}</p>
              </div>
              
              <div className="border rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Available for Analysis</h4>
                <p className="text-3xl font-semibold text-gray-800 dark:text-white">
                  {videos.length}
                </p>
              </div>
              
              <div className="border rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Analysis Type</h4>
                <p className="text-xl font-semibold text-gray-800 dark:text-white">Semantic Analysis</p>
              </div>
            </div>

            {/* Info and Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
              <h3 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">Analysis Instructions</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                For detailed analysis of these videos, use the <span className="font-medium">Batch Analysis</span> tab to process videos with Google Gemini AI.
                The Batch Analysis will provide detailed semantic insights and content analysis.
              </p>
            </div>
            
            {/* Videos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.slice(0, 6).map((video) => (
                  <div key={video.id || video.aweme_id} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
                        {video.desc || 'No description available'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {video.id || video.aweme_id || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {videos.length > 6 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  +{videos.length - 6} more videos available for analysis
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 