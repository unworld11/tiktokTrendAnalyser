'use client';

import { useState } from 'react';
import GeminiAnalysisDashboard from './GeminiAnalysisDashboard';

interface VideoAnalysisResult {
  text?: string;
  candidates?: any[];
}

interface VideoAnalyzerProps {
  videoUrl: string;
  videoId?: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function VideoAnalyzer({
  videoUrl,
  videoId = 'unknown',
  onComplete,
  onError
}: VideoAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(30);

      // Basic URL validation
      try {
        new URL(videoUrl);
      } catch (e) {
        throw new Error('Invalid URL format. Please provide a valid video URL.');
      }

      setProgress(50);

      // Send the video URL for analysis
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          videoId,
          analysisType: 'general'
        }),
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data.result);
      
      // Set dashboard loading state when we have a result
      setIsDashboardLoading(true);
      
      if (onComplete) {
        onComplete(data.result);
      }

      setProgress(100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle dashboard loading state completion
  const handleDashboardLoaded = () => {
    setIsDashboardLoading(false);
  };

  // Format the result for display
  const formatResult = (result: any) => {
    if (!result) return null;
    
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

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isAnalyzing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
        </button>
      </div>

      {isAnalyzing && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            {progress < 50
              ? 'Preparing video...'
              : progress < 90
              ? 'Analyzing with AI...'
              : 'Finalizing results...'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-2">
              Analysis Result:
            </h3>
            <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-[500px]">
              <pre className="whitespace-pre-wrap text-sm">{formatResult(result)}</pre>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">
              Semantic Analysis Dashboard:
            </h3>
            {isDashboardLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400">Generating semantic dashboard...</p>
              </div>
            ) : (
              <GeminiAnalysisDashboard 
                results={[{ videoId, result }]}
                onProcessingComplete={handleDashboardLoaded}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 