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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              AI Smart Comments
            </h1>
            <p className="text-gray-400">Generate engaging comments for any TikTok video</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-3">
                    TikTok Video URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@username/video/..."
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent text-white placeholder-gray-500 transition-all"
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <p className="text-red-400 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FE2C55] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#FE2C55]/90 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Video...
                    </span>
                  ) : 'Generate Comments'}
                </button>
              </form>

              {/* Video Preview */}
              {videoData && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Video Preview</h3>
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={videoData.video?.cover?.url_list?.[0] || ''} 
                        alt="Video thumbnail"
                        className="w-full aspect-[9/16] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-semibold">@{videoData.author?.nickname || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-gray-400">Likes</p>
                        <p className="text-white font-semibold">{(videoData.statistics?.digg_count || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-gray-400">Comments</p>
                        <p className="text-white font-semibold">{(videoData.statistics?.comment_count || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Analysis */}
            {analysis && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#FE2C55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Video Analysis
                  </h2>
                  <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">AI Generated</span>
                </div>
                <div className="bg-black rounded-xl p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                    {analysis}
                  </pre>
                </div>
              </div>
            )}

            {/* Generated Comments */}
            {comments.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#FE2C55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Generated Comments
                  </h2>
                  <span className="text-sm text-gray-400">{comments.length} comments</span>
                </div>
                
                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <div 
                      key={index}
                      className="group bg-black border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-gray-200 flex-1">{comment}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(comment);
                            // You could add a toast notification here
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-800 rounded-lg"
                          title="Copy to clipboard"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !analysis && !comments.length && (
              <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-400 mb-2">No video analyzed yet</h3>
                <p className="text-sm text-gray-600">Enter a TikTok video URL to generate AI-powered comments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 