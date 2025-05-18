// Test script to verify OpenAI API key functionality
require('dotenv').config();
const OpenAI = require('openai');

// Remove any quotes from the API key
const apiKey = process.env.OPENAI_API_KEY?.replace(/['"]/g, '');

// Log first and last few characters of the API key (for debugging without exposing full key)
console.log(`API Key (truncated): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

const openai = new OpenAI({
  apiKey: apiKey,
});

async function testConnection() {
  try {
    // Try a simple models.list call
    console.log('Testing OpenAI API connection...');
    const models = await openai.models.list();
    console.log('OpenAI API connection successful!');
    console.log(`Found ${models.data.length} models`);
    console.log('First few models:');
    console.log(models.data.slice(0, 3).map(model => model.id));
  } catch (error) {
    console.error('OpenAI API connection error:');
    console.error(error);
  }
}

testConnection(); 