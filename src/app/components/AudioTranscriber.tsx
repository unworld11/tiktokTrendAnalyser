'use client';

import { useState } from 'react';

interface TranscriptionResult {
  transcript: string;
  textSegments?: Array<{
    text: string;
    startTime?: number;
    endTime?: number;
  }>;
  keywords?: string[];
}

interface AudioTranscriberProps {
  audioUrl: string;
  fileName: string;
  videoId?: string;
  onComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
}

export default function AudioTranscriber({
  audioUrl,
  fileName,
  videoId = 'unknown',
  onComplete,
  onError
}: AudioTranscriberProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  // Fetch the audio file and send it for transcription
  const handleTranscribe = async () => {
    setIsTranscribing(true);
    setError(null);
    setProgress(10);

    try {
      // Fetch the audio file from the URL
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error('Failed to fetch audio file');
      }

      const audioBlob = await audioResponse.blob();
      setProgress(30);

      // Create form data with the audio file
      const formData = new FormData();
      const file = new File([audioBlob], fileName, { type: audioBlob.type });
      formData.append('audioFile', file);
      formData.append('videoId', videoId);

      setProgress(50);

      // Send the audio file for transcription
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      setResult(data.transcription);
      
      if (onComplete) {
        onComplete(data.transcription);
      }

      setProgress(100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={handleTranscribe}
          disabled={isTranscribing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isTranscribing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
        </button>
      </div>

      {isTranscribing && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            {progress < 50
              ? 'Preparing audio...'
              : progress < 90
              ? 'Transcribing audio...'
              : 'Finalizing transcription...'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="font-medium text-lg mb-2">Transcription Result:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="whitespace-pre-wrap">{result.transcript}</p>
          </div>

          {result.keywords && result.keywords.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 