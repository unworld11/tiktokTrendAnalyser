import { NextResponse } from 'next/server';
import { transcribeAudio } from '../../lib/transcription';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Neither OpenAI nor Groq API key is configured' },
        { status: 500 }
      );
    }
    
    // Parse the form data directly using the native Request formData method
    const formData = await request.formData();
    
    // Get the file and videoId from the form data
    const audioFile = formData.get('audioFile') as File | null;
    const videoId = formData.get('videoId') as string || 'unknown_video';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert the file to a buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileName = audioFile.name || 'audio.mp3';
    
    // Process the audio transcription
    const transcriptionResult = await transcribeAudio(
      fileBuffer,
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
      transcription: transcriptionResult,
    });
  } catch (error: unknown) {
    console.error('Error in transcription endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process transcription',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 