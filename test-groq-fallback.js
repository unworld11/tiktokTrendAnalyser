// Test script to verify Groq transcription fallback
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

// Get Groq API key and remove any quotes
const apiKey = process.env.GROQ_API_KEY?.replace(/['"]/g, '');

// Log first and last few characters of the API key for verification
console.log(`Groq API Key (truncated): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

// Path to the test audio file
const testFilePath = path.join(__dirname, 'test-audio.mp3');

// Initialize Groq client
const groq = new Groq({
  apiKey: apiKey
});

async function testGroqTranscription() {
  try {
    if (!fs.existsSync(testFilePath)) {
      console.error(`Test file not found at ${testFilePath}`);
      return;
    }

    console.log(`Using test file at ${testFilePath}`);
    console.log('Testing Groq audio transcription API...');
    
    // Transcribe using Groq
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(testFilePath),
      model: "distil-whisper-large-v3-en",
      response_format: "verbose_json",
    });
    
    console.log('Groq transcription successful!');
    console.log('Result:', transcription.text);
  } catch (error) {
    console.error('Groq transcription error:');
    console.error(error);
  }
}

testGroqTranscription(); 