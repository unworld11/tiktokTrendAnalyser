'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { deleteFileFromStorage } from '@/app/lib/storage';

interface MediaFile {
  name: string;
  id: string;
  metadata: {
    size: number;
    mimetype?: string;
  } | Record<string, any>;
  created_at: string;
  updated_at: string;
  publicUrl: string;
}

interface MediaGalleryProps {
  bucket: string;
  title?: string;
  type?: 'video' | 'audio' | 'all';
  onSelect?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
  maxItems?: number;
}

export default function MediaGallery({
  bucket,
  title = 'Media Gallery',
  type = 'all',
  onSelect,
  onDelete,
  maxItems = 50
}: MediaGalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Load files from Supabase storage
  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.storage
          .from(bucket)
          .list('', {
            limit: maxItems,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (error) {
          throw error;
        }

        if (!data) {
          setFiles([]);
          return;
        }

        // Filter files by type if needed
        let filteredFiles = data;
        if (type !== 'all') {
          filteredFiles = data.filter(file => {
            const mimeType = file.metadata?.mimetype || '';
            return type === 'video' 
              ? mimeType.startsWith('video/')
              : mimeType.startsWith('audio/');
          });
        }

        // Get public URLs for each file
        const filesWithUrls = filteredFiles.map(file => {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(file.name);

          return {
            ...file,
            publicUrl: publicUrlData.publicUrl
          } as MediaFile;
        });

        setFiles(filesWithUrls);
      } catch (err) {
        console.error('Error loading files:', err);
        setError('Failed to load files. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [bucket, type, maxItems, supabase]);

  // Handle file selection
  const handleSelect = (file: MediaFile) => {
    setSelectedFile(file);
    if (onSelect) {
      onSelect(file);
    }
  };

  // Handle file deletion
  const handleDelete = async (file: MediaFile) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        setIsDeleting(true);
        
        const success = await deleteFileFromStorage(file.name, bucket);
        
        if (!success) {
          throw new Error('Failed to delete file');
        }
        
        setFiles(prev => prev.filter(f => f.id !== file.id));
        
        if (selectedFile?.id === file.id) {
          setSelectedFile(null);
        }
        
        if (onDelete) {
          onDelete(file);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
        setError('Failed to delete file. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Format file size for display
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Render appropriate media preview
  const renderMediaPreview = (file: MediaFile) => {
    const mimeType = file.metadata?.mimetype || '';
    
    if (mimeType.startsWith('video/')) {
      return (
        <video 
          src={file.publicUrl} 
          className="w-full h-48 object-cover rounded"
          controls
        />
      );
    } else if (mimeType.startsWith('audio/')) {
      return (
        <div className="w-full flex flex-col items-center justify-center h-48 bg-gray-100 rounded">
          <svg 
            className="w-12 h-12 text-gray-500 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <audio src={file.publicUrl} controls className="w-4/5" />
        </div>
      );
    } else {
      return (
        <div className="w-full flex items-center justify-center h-48 bg-gray-100 rounded">
          <svg 
            className="w-12 h-12 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">No files found in this bucket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(file => (
            <div 
              key={file.id} 
              className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                selectedFile?.id === file.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="cursor-pointer" onClick={() => handleSelect(file)}>
                {renderMediaPreview(file)}
              </div>
              
              <div className="p-3">
                <h3 className="font-medium text-gray-800 truncate" title={file.name}>
                  {file.name.split('/').pop()}
                </h3>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>{formatFileSize(file.metadata.size)}</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => handleSelect(file)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    disabled={isDeleting}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 