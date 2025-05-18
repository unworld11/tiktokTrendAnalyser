import { NextResponse } from 'next/server';
import { extractAudioFromVideo, extractVideoUrl } from '../../lib/audioExtractor';
import { transcribeAudio } from '../../lib/transcription';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Neither OpenAI nor Groq API key is configured' },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!body.video) {
      return NextResponse.json(
        { error: 'No video data provided' },
        { status: 400 }
      );
    }
    
    const video = body.video;
    const videoId = video.aweme_id || video.id || 'unknown_video';
    
    // Extract the video URL from the TikTok video object
    const videoUrl = extractVideoUrl(video);
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Could not extract video URL from TikTok data' },
        { status: 400 }
      );
    }
    
    console.log(`Extracting audio from video ID: ${videoId}`);
    
    try {
      // Extract the audio from the video
      const audioBuffer = await extractAudioFromVideo(videoUrl, videoId);
      
      // Generate a name for the audio file
      const fileName = `tiktok_${videoId}.mp3`;
      
      try {
        // Process the audio transcription
        const transcriptionResult = await transcribeAudio(
          audioBuffer,
          fileName,
          videoId
        );
        
        // Create directory for storing transcriptions if it doesn't exist
        const transcriptionDir = path.join(process.cwd(), 'public', 'transcriptions');
        if (!fs.existsSync(transcriptionDir)) {
          fs.mkdirSync(transcriptionDir, { recursive: true });
        }
        
        // Save the transcription result to a file
        const transcriptionPath = path.join(transcriptionDir, `${videoId}.json`);
        fs.writeFileSync(transcriptionPath, JSON.stringify(transcriptionResult, null, 2));
        
        // Return the transcription result
        return NextResponse.json({
          success: true,
          videoId,
          videoUrl,
          transcription: transcriptionResult,
        });
      } catch (transcriptionError: unknown) {
        console.error('Error in transcription:', transcriptionError);
        return NextResponse.json(
          { 
            error: 'Failed to transcribe audio',
            details: transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError),
            stack: transcriptionError instanceof Error ? transcriptionError.stack : undefined,
          },
          { status: 500 }
        );
      }
    } catch (audioError: unknown) {
      console.error('Error in audio extraction:', audioError);
      return NextResponse.json(
        { 
          error: 'Failed to extract audio from video',
          details: audioError instanceof Error ? audioError.message : String(audioError),
          stack: audioError instanceof Error ? audioError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in audio extraction endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process audio extraction request',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 