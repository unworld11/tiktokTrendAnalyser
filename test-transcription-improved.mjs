// Improved test script for OpenAI audio transcription following official docs
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Initialize dotenv
config();

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Remove any quotes from the API key
const apiKey = process.env.OPENAI_API_KEY?.replace(/['"]/g, '');

// Log first and last few characters of the API key
console.log(`API Key (truncated): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

// Path to the test audio file
const testFilePath = path.join(__dirname, 'test-audio.mp3');

async function testTranscription() {
  try {
    console.log(`Using test file at ${testFilePath}`);
    console.log('Testing OpenAI audio transcription API...');
    
    // Create form data
    const form = new FormData();
    form.append('model', 'whisper-1');
    form.append('file', await fileFromPath(testFilePath));
    
    // Send request directly using fetch instead of the OpenAI SDK
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: form,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error (${response.status}):`, errorData);
      return;
    }
    
    const result = await response.json();
    console.log('Transcription successful!');
    console.log('Result:', result.text);
  } catch (error) {
    console.error('Error during transcription:');
    console.error(error);
  }
}

testTranscription(); 