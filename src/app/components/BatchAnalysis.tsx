import { useState, useEffect } from 'react';
import GeminiAnalysisDashboard from './GeminiAnalysisDashboard';
import Dashboard from './Dashboard';
import SemanticClustering from './SemanticClustering';

type VideoResult = {
  videoUrl: string;
  videoId: string;
  result: any;
  error?: string;
};

type Video = {
  id?: string;
  aweme_id?: string;
  desc?: string;
  videoUrl?: string;  // Apify provides this directly
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
    diggCount?: number;
    comment_count?: number;
    commentCount?: number;
    play_count?: number;
    playCount?: number;
    share_count?: number;
    shareCount?: number;
  };
};

type BatchAnalysisProps = {
  videos?: Video[];
};

export default function BatchAnalysis({ videos = [] }: BatchAnalysisProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [activeTab, setActiveTab] = useState<'input' | 'videos' | 'dashboard' | 'semantic' | 'clusters'>('videos');
  const [videosToProcess, setVideosToProcess] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  useEffect(() => {
    // If videos are provided, set them as the default data source
    if (videos && videos.length > 0) {
      console.log('Videos received from props:', videos.length);
      console.log('First video sample:', JSON.stringify(videos[0], null, 2));
      setVideosToProcess(videos);
    }
  }, [videos]);

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const extractVideoUrl = (video: any): string | null => {
    try {
      // Log the video object for debugging
      console.log('Extracting URL from video:', JSON.stringify(video, null, 2));
      
      // First check for direct videoUrl property from Apify
      if (video.videoUrl) {
        console.log('Found direct videoUrl property:', video.videoUrl);
        return video.videoUrl;
      }
      
      // Check for video.bit_rate array (from TikTok API structure)
      if (video.video?.bit_rate && Array.isArray(video.video.bit_rate)) {
        for (const bitRate of video.video.bit_rate) {
          if (bitRate.play_addr?.url_list && bitRate.play_addr.url_list.length > 0) {
            console.log('Found URL in bit_rate.play_addr:', bitRate.play_addr.url_list[0]);
            return bitRate.play_addr.url_list[0];
          }
        }
      }
      
      // Try to get the default play address
      if (video.video?.play_addr?.url_list?.[0]) {
        console.log('Found URL in play_addr:', video.video.play_addr.url_list[0]);
        return video.video.play_addr.url_list[0];
      }
      
      // Try share_url as a fallback
      if (video.share_url) {
        console.log('Using share_url as fallback:', video.share_url);
        return video.share_url;
      }
      
      // Try download_addr as another option
      if (video.video?.download_addr?.url_list?.[0]) {
        console.log('Using download_addr as fallback:', video.video.download_addr.url_list[0]);
        return video.video.download_addr.url_list[0];
      }

      console.log('Could not extract URL from video');
      return null;
    } catch (error) {
      console.error('Error extracting video URL:', error);
      return null;
    }
  };

  const processVideo = async (video: any, index: number): Promise<VideoResult> => {
    try {
      console.log(`Processing video #${index + 1}:`, video.id || video.aweme_id || `video-${index}`);
      const videoUrl = extractVideoUrl(video);
      const videoId = video.id || video.aweme_id || `video-${index}`;
      const videoDesc = video.desc || '';
      
      if (!videoUrl) {
        console.error(`No URL found for video #${index + 1}`);
        return {
          videoUrl: 'Unknown URL',
          videoId,
          result: null,
          error: 'Could not extract video URL'
        };
      }

      console.log(`Sending video #${index + 1} to analysis API with URL: ${videoUrl}`);
      console.log(`Video description: ${videoDesc}`);
      // Call the video analysis API
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoUrl,
          videoId,
          videoDesc
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to analyze video');
      }

      const data = await response.json();
      console.log(`Analysis completed for video #${index + 1}`);
      return {
        videoUrl,
        videoId,
        result: data.result
      };
    } catch (error) {
      console.error(`Error analyzing video at index ${index}:`, error);
      return {
        videoUrl: extractVideoUrl(video) || 'Unknown',
        videoId: video.id || video.aweme_id || `video-${index}`,
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const processVideosFromJson = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProcessedCount(0);
    
    try {
      let parsedVideos;
      try {
        console.log('Parsing JSON input...');
        parsedVideos = JSON.parse(jsonInput);
        console.log('JSON parsed successfully');
        
        if (!Array.isArray(parsedVideos)) {
          // If it's not an array, check if it might be wrapped in an object
          if (parsedVideos && typeof parsedVideos === 'object' && parsedVideos.videos && Array.isArray(parsedVideos.videos)) {
            console.log('Videos found inside wrapper object');
            parsedVideos = parsedVideos.videos;
          } else {
            throw new Error('Input is not an array of videos');
          }
        }
        
        console.log(`Found ${parsedVideos.length} videos in JSON input`);
        console.log('First video from JSON:', JSON.stringify(parsedVideos[0], null, 2));
        setVideosToProcess(parsedVideos);
      } catch (parseError) {
        setError('Invalid JSON format. Please check your input.');
        setLoading(false);
        return;
      }
      
      await processVideosArray(parsedVideos);
    } catch (err) {
      console.error('Error processing videos:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  const processVideosArray = async (videosArray: any[]) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProcessedCount(0);
    
    try {
      console.log(`Starting batch processing of ${videosArray.length} videos`);
      setTotalVideos(videosArray.length);
      const newResults: VideoResult[] = [];
      
      // Process videos one by one
      for (let i = 0; i < videosArray.length; i++) {
        setCurrentVideoIndex(i);
        const result = await processVideo(videosArray[i], i);
        newResults.push(result);
        setResults([...newResults]);
        setProcessedCount(i + 1);
        
        // Add a small delay between requests to prevent rate limiting
        if (i < videosArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Completed processing ${videosArray.length} videos`);
      // Switch to dashboard tab when done
      setActiveTab('dashboard');
      
      // Give a small delay before removing loading state
      setTimeout(() => {
        setLoading(false);
        setCurrentVideoIndex(null);
      }, 1500);
      
    } catch (err) {
      console.error('Error processing videos:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      setCurrentVideoIndex(null);
    }
  };

  const handleProcessFetchedVideos = () => {
    if (videosToProcess.length === 0) {
      setError('No videos available to process');
      return;
    }
    console.log(`Starting to process ${videosToProcess.length} fetched videos`);
    processVideosArray(videosToProcess);
  };

  // Format the result for display
  const formatResult = (result: any) => {
    if (!result) return "No result";
    
    // Handle different result formats
    let textContent = '';
    
    if (result.candidates && result.candidates.length > 0) {
      // Extract text from candidates
      for (const candidate of result.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              textContent += part.text + '\n\n';
            }
          }
        }
      }
    } else if (result.text) {
      textContent = result.text;
    } else {
      textContent = JSON.stringify(result, null, 2);
    }
    
    return textContent;
  };

  // Function to output Apify data for checking
  const logApifyData = () => {
    console.log('=========== APIFY DATA LOG ===========');
    console.log(JSON.stringify(videosToProcess, null, 2));
    console.log('======================================');
    
    // Show a message to the user
    alert('Apify data has been logged to the console. Please check developer tools.');
  };

  return (
    <div className="space-y-6">
      <div className="w-full grid grid-cols-1 lg:grid-cols-1 lg:items-start bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">
          Batch Video Analysis
        </h2>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-4 px-3 border-b-2 font-medium text-sm
                ${activeTab === 'videos'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Fetched Videos
            </button>
            
            <button
              onClick={() => setActiveTab('input')}
              className={`py-4 px-3 border-b-2 font-medium text-sm
                ${activeTab === 'input'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              JSON Input
            </button>
            
            {/* Always-available Semantic Dashboard tab */}
            <button
              onClick={() => setActiveTab('semantic')}
              className={`py-4 px-3 border-b-2 font-medium text-sm
                ${activeTab === 'semantic'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Semantic Dashboard
            </button>
            {/* Always-available Clustering tab */}
            <button
              onClick={() => setActiveTab('clusters')}
              className={`py-4 px-3 border-b-2 font-medium text-sm
                ${activeTab === 'clusters'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Clustering
            </button>

            {results.length > 0 && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-3 border-b-2 font-medium text-sm
                  ${activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                Gemini Results
              </button>
            )}
          </nav>
        </div>
        
        {activeTab === 'videos' && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5">
            <div className="mb-4">
              {videosToProcess.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No videos available</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Use the search form above to find TikTok videos or paste JSON data in the JSON Input tab.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('input')}
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add JSON Data
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {`${videosToProcess.length} videos ready to process.`}
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={logApifyData}
                      className="px-4 py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      Log Data to Console
                    </button>
                    <button
                      onClick={handleProcessFetchedVideos}
                      disabled={loading || videosToProcess.length === 0}
                      className={`px-5 py-2 rounded-md text-white font-medium transition-colors ${
                        loading || videosToProcess.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {loading ? 'Processing...' : `Process ${videosToProcess.length} Videos`}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {videosToProcess.length > 0 && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {videosToProcess.map((video, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="font-medium text-gray-900 dark:text-white text-base">
                      {video.desc || `Video #${index + 1}`}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ID: {video.id || video.aweme_id || `unknown-${index}`}
                    </p>
                    {video.videoUrl && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        URL: {video.videoUrl}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'input' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Paste TikTok videos JSON from Apify
              </label>
              <textarea
                value={jsonInput}
                onChange={handleJsonInputChange}
                rows={8}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Paste your JSON data here..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={processVideosFromJson}
                disabled={loading || !jsonInput}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading || !jsonInput
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Processing...' : 'Process JSON'}
              </button>
            </div>
          </>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="mt-4">
            <div className="flex items-center">
              <div className="mr-3 inline-block animate-spin h-5 w-5 border-3 border-indigo-500 rounded-full border-t-transparent"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processing video {currentVideoIndex !== null ? currentVideoIndex + 1 : '?'} of {totalVideos}...
              </p>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${totalVideos > 0 ? (processedCount / totalVideos) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Generating semantic dashboard from {results.length} videos...
                </p>
              </div>
            ) : (
              <>
                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      No analysis results available. Please process videos first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Semantic Analysis Dashboard
                    </h3>
                    
                    {/* Brief summary of processed videos */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Processed Videos</h4>
                        <span className="text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded-full">
                          {results.filter(r => !r.error).length} of {results.length} successful
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto">
                        {results.map((result, index) => (
                          <div 
                            key={index} 
                            className={`text-xs rounded p-2 ${result.error 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            }`}
                          >
                            <div className="font-medium truncate">{result.videoId}</div>
                            {result.error ? (
                              <div>Error: {result.error}</div>
                            ) : (
                              <div>Analysis complete</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <GeminiAnalysisDashboard 
                      results={results
                        .filter(r => r && !r.error)
                        .map(r => ({
                          videoId: r.videoId,
                          result: r.result
                        }))}
                      isLoading={loading}
                      onProcessingComplete={() => {
                        console.log("Analysis dashboard processing complete");
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'semantic' && (
          <div className="w-full mt-6">
            <Dashboard videos={videos} />
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="w-full mt-6">
            <SemanticClustering videos={videos} selectedCluster={selectedCluster} onSelectCluster={setSelectedCluster} />
          </div>
        )}
      </div>
    </div>
  );
} 