// Test script to verify OpenAI audio transcription API
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Remove any quotes from the API key
const apiKey = process.env.OPENAI_API_KEY?.replace(/['"]/g, '');

// Log first and last few characters of the API key (for debugging without exposing full key)
console.log(`API Key (truncated): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

const openai = new OpenAI({
  apiKey: apiKey,
});

// Create a small test audio file
const testFilePath = path.join(__dirname, 'test-audio.mp3');

async function downloadTestAudio() {
  try {
    // Check if test file already exists
    if (!fs.existsSync(testFilePath)) {
      console.log('Creating a test audio file...');
      // Generate a simple silent MP3 using node buffer
      const silentBuffer = Buffer.alloc(10000);
      fs.writeFileSync(testFilePath, silentBuffer);
      console.log(`Test file created at ${testFilePath}`);
    } else {
      console.log(`Using existing test file at ${testFilePath}`);
    }
    return true;
  } catch (error) {
    console.error('Error creating test audio file:', error);
    return false;
  }
}

async function testTranscription() {
  try {
    const fileCreated = await downloadTestAudio();
    if (!fileCreated) {
      console.error('Failed to create test audio file');
      return;
    }

    console.log('Testing OpenAI audio transcription API...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(testFilePath),
      model: 'whisper-1',
    });

    console.log('Transcription successful!');
    console.log('Result:', transcription.text);
  } catch (error) {
    console.error('OpenAI audio transcription error:');
    console.error(error);
  }
}

testTranscription(); 