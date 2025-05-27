'use client';

import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';

export default function AICommentsPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [comments, setComments] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setComments([]);
    setAnalysis('');
    setVideoData(null);

    if (!videoUrl.trim()) {
      setError('Please enter a TikTok video URL');
      return;
    }

    // Validate TikTok URL
    if (!videoUrl.includes('tiktok.com')) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Fetch video data from TikTok using Apify
      const videoResponse = await fetch('/api/ai-comments/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video data');
      }

      const { video, analysis: videoAnalysis } = await videoResponse.json();
      setVideoData(video);
      setAnalysis(videoAnalysis);

      // Step 2: Generate comments based on the analysis
      const commentsResponse = await fetch('/api/ai-comments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysis: videoAnalysis,
          videoDescription: video.desc,
          author: video.author?.nickname || 'Unknown'
        }),
      });

      if (!commentsResponse.ok) {
        throw new Error('Failed to generate comments');
      }

      const { comments: generatedComments } = await commentsResponse.json();
      setComments(generatedComments);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Smart Comments Generator
          </h1>
          <ThemeToggle />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TikTok Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@username/video/..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing Video...' : 'Generate Comments'}
              </button>
            </form>
          </div>

          {/* Video Preview */}
          {videoData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Video Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img 
                    src={videoData.video?.cover?.url_list?.[0] || ''} 
                    alt="Video thumbnail"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Author:</span> @{videoData.author?.nickname || 'Unknown'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Description:</span> {videoData.desc || 'No description'}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>❤️ {videoData.statistics?.digg_count || 0}</span>
                    <span>💬 {videoData.statistics?.comment_count || 0}</span>
                    <span>🔄 {videoData.statistics?.share_count || 0}</span>
                    <span>▶️ {videoData.statistics?.play_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Analysis */}
          {analysis && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Video Analysis</h2>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {analysis}
                </pre>
              </div>
            </div>
          )}

          {/* Generated Comments */}
          {comments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Generated Comments ({comments.length})
              </h2>
              <div className="space-y-3">
                {comments.map((comment, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <p className="text-gray-800 dark:text-gray-200">{comment}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(comment)}
                      className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 