import { NextResponse } from 'next/server';
import { transcribeAudio } from '../../lib/transcription';
import { supabase } from '../../lib/supabaseClient';

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
    
    // Save the transcription result to Supabase
    const transcriptionPathInBucket = `transcriptions/${videoId}.json`;
    const { error: transcriptionUploadError } = await supabase.storage
      .from('temporary_files')
      .upload(transcriptionPathInBucket, JSON.stringify(transcriptionResult, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });

    if (transcriptionUploadError) {
      console.error('Error uploading transcription to Supabase:', transcriptionUploadError);
      // Optionally, you could return an error response here if this step is critical
      // For now, logging the error and proceeding.
    }
    
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