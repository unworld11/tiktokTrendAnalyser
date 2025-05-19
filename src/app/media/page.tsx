import { createClient } from '@/app/utils/supabase/server';
import { cookies } from 'next/headers';
import MediaUploader from '@/app/components/MediaUploader';
import MediaGallery from '@/app/components/MediaGallery';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Media Management</h1>
      
      {error || !user ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>You need to be logged in to access this page.</p>
          <a href="/login" className="text-blue-500 underline">Go to login</a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
              <p className="text-gray-600 mb-4">
                Upload video files to Supabase storage. Videos will be stored in the &apos;videos&apos; bucket.
              </p>
              <MediaUploader 
                type="video"
                maxSizeMB={100}
                allowedTypes="video/mp4,video/quicktime,video/webm"
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Upload Audio</h2>
              <p className="text-gray-600 mb-4">
                Upload audio files to Supabase storage. Audio will be stored in the &apos;audios&apos; bucket 
                and can be sent for transcription.
              </p>
              <MediaUploader 
                type="audio"
                maxSizeMB={50}
                allowedTypes="audio/mp3,audio/mpeg,audio/wav,audio/m4a"
              />
            </div>
          </div>
          
          <div className="mt-12">
            <MediaGallery 
              bucket="videos"
              title="Videos"
              type="video"
            />
          </div>
          
          <div className="mt-12">
            <MediaGallery 
              bucket="audios"
              title="Audio Files"
              type="audio"
            />
          </div>
          
          <div className="mt-12 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Transcription Process</h2>
            <p className="text-gray-600 mb-4">
              To transcribe an audio file:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>Upload an audio file using the audio uploader above</li>
              <li>Select the audio file from the Audio Files gallery</li>
              <li>Click &quot;Transcribe&quot; to send the audio for transcription</li>
              <li>The transcription will be saved to Supabase storage in the &apos;transcriptions&apos; bucket</li>
            </ol>
            
            <div className="mt-6 bg-blue-50 p-4 rounded">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Transcription uses OpenAI&apos;s Whisper API or Groq (as fallback) 
                and requires appropriate API keys to be configured in your environment variables.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 