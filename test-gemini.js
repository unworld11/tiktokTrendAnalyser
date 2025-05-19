/**
 * Test script for Gemini API configuration
 * Run with: node test-gemini.js
 */

const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Get the API key
const apiKey = process.env.GOOGLE_API_KEY;

// Log whether API key is available (without exposing the full key)
if (apiKey) {
  console.log(`✅ GOOGLE_API_KEY found in environment (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})`);
} else {
  console.error('❌ GOOGLE_API_KEY is not set in the environment');
  process.exit(1);
}

// Initialize the Gemini client
const genAI = new GoogleGenAI(apiKey);

// Simple test function
async function testGeminiApi() {
  try {
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Test with a simple prompt
    const result = await model.generateContent('Hello, testing API configuration');
    
    console.log('✅ API connection successful');
    
    // Inspect the response object
    console.log('Response object structure:', JSON.stringify(result, null, 2));
    
    // Check if response exists and has text method
    if (result.response) {
      try {
        const text = result.response.text();
        if (text !== undefined) {
          console.log('Response text:', text);
        } else {
          console.log('⚠️ Response text() method returned undefined');
          console.log('Response candidates:', result.response.candidates);
          
          // Try to access the text content directly from the response structure
          if (result.response.candidates && 
              result.response.candidates[0] && 
              result.response.candidates[0].content && 
              result.response.candidates[0].content.parts && 
              result.response.candidates[0].content.parts[0]) {
            console.log('Text from candidates:', result.response.candidates[0].content.parts[0].text);
          }
        }
      } catch (textError) {
        console.error('❌ Error calling text() method:', textError);
        console.log('Full response object for debugging:', result);
      }
    } else {
      console.error('❌ Response object is undefined or missing expected structure');
    }
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Run the test
testGeminiApi()
  .then(success => {
    if (success) {
      console.log('✅ All tests passed');
    } else {
      console.error('❌ Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 