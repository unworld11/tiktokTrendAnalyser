import { NextResponse } from 'next/server';
// import fs from 'fs'; // No longer needed for disk operations
// import path from 'path'; // No longer needed for disk operations
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client

export async function GET(request: Request) {
  try {
    // Get the videoId from the query parameters
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      );
    }
    
    // Try to load the transcription file from Supabase
    const transcriptionPathInBucket = `transcriptions/${videoId}.json`;
    
    const { data, error: downloadError } = await supabase.storage
      .from('temporary_files')
      .download(transcriptionPathInBucket);

    if (downloadError) {
      if (downloadError.message.includes('The resource was not found')) {
        return NextResponse.json(
          { error: 'Transcription not found for this video in Supabase' },
          { status: 404 }
        );
      }
      console.error('Error downloading transcription from Supabase:', downloadError);
      return NextResponse.json(
        { error: 'Failed to fetch transcript from Supabase', details: downloadError.message },
        { status: 500 }
      );
    }
    
    if (data) {
      const transcriptionData = JSON.parse(await data.text());
      return NextResponse.json({
        success: true,
        videoId,
        transcription: transcriptionData
      });
    }

    // Fallback if data is somehow null without an error (should not happen with Supabase download)
    return NextResponse.json(
      { error: 'Failed to retrieve transcription data' },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 