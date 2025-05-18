import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    
    // Try to load the transcription file from disk
    const transcriptionDir = path.join(process.cwd(), 'public', 'transcriptions');
    const transcriptionPath = path.join(transcriptionDir, `${videoId}.json`);
    
    // Check if the transcription file exists
    if (!fs.existsSync(transcriptionPath)) {
      return NextResponse.json(
        { error: 'Transcription not found for this video' },
        { status: 404 }
      );
    }
    
    // Read and parse the transcription file
    const transcriptionData = JSON.parse(fs.readFileSync(transcriptionPath, 'utf-8'));
    
    return NextResponse.json({
      success: true,
      videoId,
      transcription: transcriptionData
    });
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