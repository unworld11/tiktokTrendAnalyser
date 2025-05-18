import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import FormData from 'form-data';
import Groq from 'groq-sdk';

export interface TranscriptionResult {
  transcript: string;
  textSegments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    keywords: string[];
  }>;
  onScreenText: string[];
  keywords: string[];
}

// Extract keywords from transcript
const extractKeywords = (transcript: string): string[] => {
  const keywordPatterns = [
    { term: "ozempic", label: "ozempic" },
    { term: "side effects", label: "side effects" },
    { term: "constipation", label: "constipation" },
    { term: "nutrition", label: "nutrition" },
    { term: "vitamins", label: "supplements" },
    { term: "supplements", label: "supplements" },
    { term: "mood swings", label: "mood swings" },
    { term: "fatigue", label: "fatigue" },
    { term: "brain fog", label: "brain fog" },
    { term: "weight loss", label: "weight loss" },
    { term: "doctor", label: "medical" }
  ];

  // Extract keywords present in transcript
  const keywordsFound = keywordPatterns
    .filter(pattern => transcript.toLowerCase().includes(pattern.term))
    .map(pattern => pattern.label);

  // Ensure unique keywords
  return [...new Set(keywordsFound)];
};

// Create segments from transcript
const createSegments = (transcript: string, keywords: string[]): TranscriptionResult['textSegments'] => {
  return transcript.split('. ').map((text, index) => {
    const segmentKeywords = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase()));
    
    return {
      text: text.trim() + (text.endsWith('.') ? '' : '.'),
      startTime: index * 5, // Mock timestamp: 5 seconds per segment (will be replaced with actual timestamps in future)
      endTime: (index + 1) * 5 - 0.5,
      keywords: segmentKeywords
    };
  });
};

// Generate mock on-screen text (in a real implementation, this would use OCR)
const generateOnScreenText = (videoId: string): string[] => {
  const onScreenTextOptions = [
    ['#ozempic', '#weightloss', '#sideeffects', 'Not medical advice'],
    ['#ozempicweightloss', '#GLP1', '#sideeffects', 'Consult your doctor'],
    ['#ozempic', '#weightlossjourney', '#realresults', 'Follow for more health tips'],
    ['#ozempicjourney', '#weightloss', '#sideffectsofozempic', 'Results may vary'],
    ['#weightloss', '#ozempic', '#supplementstotake', 'My personal experience']
  ];
  
  const index = parseInt(videoId.replace('video_', '')) % onScreenTextOptions.length;
  return onScreenTextOptions[index];
};

/**
 * Try to transcribe audio using Groq API as a fallback
 */
async function transcribeWithGroq(audioFilePath: string): Promise<string> {
  // Get Groq API key and remove any quotes
  const apiKey = process.env.GROQ_API_KEY?.replace(/['"]/g, '');
  
  if (!apiKey) {
    throw new Error('Groq API key is missing or invalid');
  }

  console.log('Falling back to Groq for transcription...');
  
  try {
    // Initialize Groq client
    const groq = new Groq({
      apiKey: apiKey
    });
    
    // Transcribe using Groq
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "distil-whisper-large-v3-en",
      response_format: "verbose_json",
    });
    
    console.log('Groq transcription successful!');
    return transcription.text || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Groq API Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Transcribe an audio file using OpenAI's Whisper API with Groq fallback
 * Following the documentation at https://platform.openai.com/docs/guides/speech-to-text
 */
export async function transcribeAudio(audioBuffer: Buffer, fileName: string, videoId: string): Promise<TranscriptionResult> {
  try {
    // Get API key and remove any quotes
    const openaiApiKey = process.env.OPENAI_API_KEY?.replace(/['"]/g, '');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is missing or invalid');
    }

    console.log(`Starting transcription for video ID: ${videoId}`);
    
    // Create a temporary file from the buffer to send to OpenAI
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);
    
    // Write the buffer to the temporary file
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    console.log(`Audio file saved to ${tempFilePath}, file size: ${audioBuffer.length} bytes`);
    
    let transcript = '';
    let usedFallback = false;
    
    try {
      // Try OpenAI first
      try {
        // Create form data for the API request
        const form = new FormData();
        form.append('model', 'whisper-1');
        form.append('file', fs.createReadStream(tempFilePath));
        
        // Make direct fetch request to OpenAI API
        console.log(`Calling OpenAI API with model: whisper-1`);
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: form,
        });
        
        // Check for API errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch {
            // If not JSON, use text as is
            console.error('API Error Response (not JSON):', errorText);
            throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
          }
          
          // Check for quota error or other errors and throw
          console.error('OpenAI API Error:', errorJson);
          throw new Error(`OpenAI API Error: ${errorJson.error?.message || response.statusText}`);
        }
        
        // Parse the successful response
        const transcriptionResult = await response.json();
        transcript = transcriptionResult.text;
        console.log(`OpenAI Transcription successful, text length: ${transcript.length} characters`);
      } catch (openaiError) {
        console.error('OpenAI transcription failed, trying Groq fallback...', openaiError);
        
        // Try Groq as fallback
        transcript = await transcribeWithGroq(tempFilePath);
        usedFallback = true;
      }
      
      // Process the transcript to extract keywords
      const keywords = extractKeywords(transcript);
      
      // Create text segments
      const textSegments = createSegments(transcript, keywords);
      
      // Generate mock on-screen text
      const onScreenText = generateOnScreenText(videoId);
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (deleteError) {
        console.error('Error cleaning up temporary file:', deleteError);
      }
      
      // Add fallback indicator to keywords if we used the fallback
      if (usedFallback) {
        keywords.push('used_groq_fallback');
      }
      
      return {
        transcript,
        textSegments,
        onScreenText,
        keywords,
      };
    } catch (apiError: Error) {
      console.error('API Error in transcription:', apiError);
      
      // Clean up the temporary file on error too
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (deleteError) {
          console.error('Error cleaning up temporary file:', deleteError);
        }
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
} 