import { useState, useEffect, useRef, useCallback } from 'react';

type Video = {
  id?: string;
  aweme_id?: string;
  transcriptData?: {
    transcript: string;
    keywords: string[];
  };
};

type TranscriptAnalysisProps = {
  video: Video | null;
  globalTranscriptionInProgress?: boolean;
};

type TranscriptData = {
  transcript: string;
  onScreenText: string[];
  keywords: string[];
  textSegments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    keywords: string[];
  }>;
};

// New type for bulk transcription status
type BulkTranscriptionStatus = {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  videos: {
    [videoId: string]: 'pending' | 'processing' | 'completed' | 'failed';
  };
};

export default function TranscriptAnalysis({ video, globalTranscriptionInProgress = false }: TranscriptAnalysisProps) {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoTranscriptionAttempted, setAutoTranscriptionAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [bulkTranscriptionStatus, setBulkTranscriptionStatus] = useState<BulkTranscriptionStatus | null>(null);
  const [bulkTranscriptionInProgress, setBulkTranscriptionInProgress] = useState(false);

  // Fetch all videos on component mount
  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        const response = await fetch('/api/get-all-videos');
        if (response.ok) {
          const data = await response.json();
          setAllVideos(data.videos || []);
        }
      } catch (error) {
        console.error('Error fetching all videos:', error);
      }
    };

    fetchAllVideos();
  }, []);

  const handleAutoTranscriptionRequest = useCallback(async () => {
    if (!video) {
      setError('No video selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the audio extraction and transcription API
      const response = await fetch('/api/extract-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to extract and transcribe audio');
      }

      const data = await response.json();
      setTranscriptData(data.transcription);
    } catch (err) {
      console.error('Error extracting and transcribing audio:', err);
      let errorMessage = 'Failed to process automatic transcription';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setAutoTranscriptionAttempted(true);
    }
  }, [video]);

  // New function to handle bulk transcription of all videos
  const handleBulkTranscriptionRequest = async () => {
    if (bulkTranscriptionInProgress) {
      return;
    }

    if (allVideos.length === 0) {
      setError('No videos available to transcribe');
      return;
    }

    setBulkTranscriptionInProgress(true);

    // Initialize status object
    const status: BulkTranscriptionStatus = {
      total: allVideos.length,
      completed: 0,
      inProgress: 0,
      failed: 0,
      videos: {}
    };

    // Initialize all videos as pending
    allVideos.forEach(v => {
      const videoId = v.id || v.aweme_id;
      if (videoId) {
        status.videos[videoId] = 'pending';
      }
    });
    
    setBulkTranscriptionStatus(status);

    // Process videos sequentially to avoid overwhelming the server
    for (const videoItem of allVideos) {
      const videoId = videoItem.id || videoItem.aweme_id;
      
      if (!videoId) continue;
      
      // Update status to processing
      setBulkTranscriptionStatus(prev => {
        if (!prev) return null;
        return {
          ...prev,
          inProgress: prev.inProgress + 1,
          videos: {
            ...prev.videos,
            [videoId]: 'processing'
          }
        };
      });

      try {
        // Call the audio extraction and transcription API
        const response = await fetch('/api/extract-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ video: videoItem }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Failed to transcribe');
        }

        // Update status to completed
        setBulkTranscriptionStatus(prev => {
          if (!prev) return null;
          return {
            ...prev,
            completed: prev.completed + 1,
            inProgress: prev.inProgress - 1,
            videos: {
              ...prev.videos,
              [videoId]: 'completed'
            }
          };
        });

        // If this is the currently selected video, update its transcript data
        if (video && (video.id === videoId || video.aweme_id === videoId)) {
          const data = await response.json();
          setTranscriptData(data.transcription);
          setAutoTranscriptionAttempted(true);
        }
      } catch (error) {
        console.error(`Error transcribing video ${videoId}:`, error);
        
        // Update status to failed
        setBulkTranscriptionStatus(prev => {
          if (!prev) return null;
          return {
            ...prev,
            failed: prev.failed + 1,
            inProgress: prev.inProgress - 1,
            videos: {
              ...prev.videos,
              [videoId]: 'failed'
            }
          };
        });
      }
    }

    setBulkTranscriptionInProgress(false);
  };

  useEffect(() => {
    if (!video) {
      setTranscriptData(null);
      setAudioFile(null);
      setAutoTranscriptionAttempted(false);
      return;
    }
    
    // Reset states for new video
    setTranscriptData(null);
    setError(null);
    
    // Only set this to false if we're not in global transcription mode
    if (!globalTranscriptionInProgress) {
      setAutoTranscriptionAttempted(false);
    }
    
    // Check if there is already a transcription for this video first
    const checkExistingTranscription = async () => {
      try {
        const response = await fetch(`/api/get-transcript?videoId=${video.id || video.aweme_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.transcription) {
            setTranscriptData(data.transcription);
            setAutoTranscriptionAttempted(true);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error checking for existing transcription:', error);
        return false;
      }
    };

    // First check if transcription already exists
    checkExistingTranscription().then(exists => {
      // If transcription doesn't exist and global transcription is not in progress,
      // try to transcribe this video automatically
      if (!exists && !globalTranscriptionInProgress) {
        handleAutoTranscriptionRequest();
      }
    });
  }, [video, handleAutoTranscriptionRequest, globalTranscriptionInProgress]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAudioFile(files[0]);
    }
  };

  const handleTranscriptionRequest = async () => {
    if (!audioFile || !video) {
      setError('Please upload an audio file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data to send to the API
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('videoId', video.id || 'unknown_video');

      // Call the transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      setTranscriptData(data.transcription);
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio file');
    } finally {
      setLoading(false);
    }
  };

  if (!video) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Select a video to view transcript analysis
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transcript & Text Analysis</h3>
        
        {/* Hide the bulk transcription button if global transcription is in progress */}
        {!globalTranscriptionInProgress && (
          <button
            className={`px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              ${bulkTranscriptionInProgress
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            onClick={handleBulkTranscriptionRequest}
            disabled={bulkTranscriptionInProgress}
          >
            {bulkTranscriptionInProgress ? 'Transcribing...' : 'Transcribe All Videos'}
          </button>
        )}
      </div>
      
      <div className="p-6">
        {/* Show global transcription message if it's in progress */}
        {globalTranscriptionInProgress && !transcriptData && (
          <div className="mb-6 p-4 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Transcription is in progress for all videos. This video will be processed automatically.
              </p>
            </div>
          </div>
        )}
      
        {/* Bulk Transcription Status */}
        {bulkTranscriptionStatus && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bulk Transcription Progress</h4>
            <div className="flex items-center mb-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${(bulkTranscriptionStatus.completed / bulkTranscriptionStatus.total) * 100}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {bulkTranscriptionStatus.completed}/{bulkTranscriptionStatus.total}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                Completed: {bulkTranscriptionStatus.completed}
              </div>
              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                In Progress: {bulkTranscriptionStatus.inProgress}
              </div>
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                Failed: {bulkTranscriptionStatus.failed}
              </div>
            </div>
          </div>
        )}
      
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Transcribing video audio...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setError(null)}
            >
              Try Again
            </button>
          </div>
        ) : transcriptData ? (
          <div className="space-y-6">
            {/* Keywords */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {transcriptData.keywords.map((keyword, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs dark:bg-indigo-900 dark:text-indigo-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            {/* On-screen Text */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">On-screen Text</h4>
              <div className="flex flex-wrap gap-2">
                {transcriptData.onScreenText.map((text, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs dark:bg-gray-700 dark:text-gray-200"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Transcript Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Transcript Timeline</h4>
              <div className="space-y-2">
                {transcriptData.textSegments.map((segment, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-md cursor-pointer transition-colors
                      ${activeSegment === idx 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    onClick={() => setActiveSegment(idx === activeSegment ? null : idx)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {`${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
                        </span>
                      </div>
                      {segment.keywords.length > 0 && (
                        <div className="flex gap-1">
                          {segment.keywords.slice(0, 2).map((keyword, kidx) => (
                            <span 
                              key={kidx} 
                              className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {keyword}
                            </span>
                          ))}
                          {segment.keywords.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs dark:bg-gray-700 dark:text-gray-200">
                              +{segment.keywords.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {segment.text}
                    </p>
                    
                    {activeSegment === idx && segment.keywords.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Key Phrases
                        </h6>
                        <div className="flex flex-wrap gap-1">
                          {segment.keywords.map((keyword, kidx) => (
                            <span 
                              key={kidx} 
                              className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Full Transcript */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Full Transcript</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {transcriptData.transcript}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            {!autoTranscriptionAttempted ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Initializing automatic transcription...</p>
                </div>
              </div>
            ) : (
              <>
                <p>Transcript analysis for the selected TikTok video.</p>
                <div className="mt-6 space-y-6">
                  {/* Auto Extract Option */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Option 1: Automatic Extraction</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Automatic extraction was attempted but failed. You can try again by clicking the button below.
                    </p>
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleAutoTranscriptionRequest}
                    >
                      Retry Auto-Extract & Transcribe
                    </button>
                  </div>
                  
                  {/* Manual Upload Option */}
                  <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Option 2: Manual Upload</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      If automatic extraction doesn&apos;t work, you can manually upload an audio file extracted from the TikTok video.
                    </p>
                    <div className="flex flex-col items-center space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="audio/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Select Audio File
                      </button>
                      {audioFile && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Selected file: {audioFile.name}
                        </div>
                      )}
                      <button
                        disabled={!audioFile}
                        className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          audioFile
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={handleTranscriptionRequest}
                      >
                        Transcribe Selected File
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 