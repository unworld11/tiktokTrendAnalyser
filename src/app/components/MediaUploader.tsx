'use client';

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface UploadResult {
  name: string;
  publicUrl: string;
  type: string;
  size: number;
  [key: string]: unknown;
}

interface MediaUploaderProps {
  type: 'video' | 'audio';
  maxSizeMB?: number;
  allowedTypes?: string;
  onUploadComplete?: (fileData: UploadResult) => void;
}

export default function MediaUploader({
  type,
  maxSizeMB = 50,
  allowedTypes = type === 'video' ? 'video/mp4,video/quicktime,video/webm' : 'audio/mp3,audio/mpeg,audio/wav,audio/m4a',
  onUploadComplete
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }
    
    const selectedFile = e.target.files[0];
    
    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum allowed size of ${maxSizeMB}MB`);
      setFile(null);
      return;
    }
    
    // Check file type
    const allowedTypesArr = allowedTypes.split(',');
    if (!allowedTypesArr.includes(selectedFile.type)) {
      setError(`File type not allowed. Allowed types: ${allowedTypes}`);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setSuccess(null);
    setError(null);
    
    try {
      // Get a unique file name to prevent overwrites
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${file.name.split('.')[0]}.${fileExt}`;
      
      // Determine which bucket to use based on file type
      const bucket = type === 'video' ? 'videos' : 'audios';
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      setSuccess(`${type === 'video' ? 'Video' : 'Audio'} uploaded successfully!`);
      
      if (onUploadComplete) {
        onUploadComplete({
          ...data,
          publicUrl,
          name: fileName,
          type: file.type,
          size: file.size,
        });
      }
      
      // Reset the file input
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
        <svg
          className={`w-12 h-12 ${type === 'video' ? 'text-blue-500' : 'text-purple-500'} mb-4`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {type === 'video' ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          )}
        </svg>
        
        <div className="text-center">
          <p className="text-lg font-medium mb-1">
            {file ? file.name : `Drop your ${type} file here or click to browse`}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            {file ? 
              `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 
              `Max size: ${maxSizeMB}MB. Allowed types: ${allowedTypes.split(',').join(', ')}`
            }
          </p>
          
          <label htmlFor="file-upload" className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 px-4 rounded-md transition duration-150 ease-in-out">
            {file ? 'Change file' : 'Browse files'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept={allowedTypes}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      </div>
      
      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : type === 'video'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {uploading ? `Uploading... ${progress}%` : `Upload ${type === 'video' ? 'Video' : 'Audio'}`}
        </button>
      )}
      
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`${type === 'video' ? 'bg-blue-600' : 'bg-purple-600'} h-2.5 rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
} 