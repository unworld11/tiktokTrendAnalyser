import { GoogleGenAI, createPartFromUri } from '@google/genai';

interface AnalysisOptions {
  model?: string;
  apiKey?: string;
  prompt?: string;
  additionalContext?: string;
}

/**
 * Safely extracts text content from a Gemini API response
 * @param response The response object from Gemini API
 * @returns The extracted text or null if not available
 */
function extractTextFromResponse(response: any): string | null {
  try {
    // Check for null or undefined response
    if (!response) {
      console.warn('Warning: Response is null or undefined');
      return null;
    }
    
    // Log response structure for debugging
    console.log('Extracting text from response structure:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
    
    // Check if response is in the expected GenerateContentResponse format
    if (response.candidates && 
        response.candidates[0] && 
        response.candidates[0].content) {
      // Access the text from parts array
      if (response.candidates[0].content.parts && 
          Array.isArray(response.candidates[0].content.parts) && 
          response.candidates[0].content.parts.length > 0) {
        return response.candidates[0].content.parts[0].text || null;
      }
      
      // For newer API versions that might use different structure
      if (typeof response.candidates[0].content.text === 'function') {
        return response.candidates[0].content.text();
      }
      
      // Try direct access if it's a plain object
      if (response.candidates[0].content.text) {
        return response.candidates[0].content.text;
      }
    }
    
    // Try parsing the response if it's a string
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        return extractTextFromResponse(parsed);
      } catch (parseError) {
        // If it's already a string, just return it
        return response;
      }
    }
    
    // If response already has text property, use it
    if (response.text) {
      return response.text;
    }
    
    // As a fallback, convert the entire response to a string
    if (typeof response === 'object') {
      return JSON.stringify(response, null, 2);
    }
  } catch (error) {
    console.warn('Warning: Could not extract text from response structure:', error);
  }

  return null;
}

/**
 * Analyzes a video file using Google's Gemini model
 * @param fileUrl The URL of the video file from Apify
 * @param options Configuration options
 * @returns The analysis result from Gemini
 */
export async function analyzeVideoWithAudio(
  fileUrl: string,
  options: AnalysisOptions = {}
) {
  const {
    model = 'gemini-2.0-flash',
    apiKey = process.env.GOOGLE_API_KEY!,
    additionalContext = '',
    prompt = `
    You are analyzing a TikTok video. Please provide a detailed analysis with the following structure:

    1. VISUAL CONTENT:
      - Describe what is happening visually in the video
      - Identify people, objects, settings, and actions
      - Note any text overlays or captions visible in the video
      
    2. AUDIO CONTENT:
      - Transcribe any speech or dialogue
      - Describe background music or sound effects
      - Note any voiceovers or narration
      
    3. KEY MOMENTS:
      - List important moments with approximate timestamps
      - Highlight any surprising or engaging elements
      
    4. THEMES & TOPICS:
      - Identify the main topic or purpose of the video
      - List any hashtags or trends being referenced
      - Note any cultural context important for understanding
      
    5. ENGAGEMENT FACTORS:
      - What might make this video appealing to viewers?
      - What emotional responses might it trigger?
      - Why might viewers share, like, or comment on this content?
      
    6. AUDIENCE & CONTEXT:
      - Who seems to be the target audience?
      - What social or cultural context is relevant?
      - How does this video fit within broader TikTok trends?
    
    7. SEMANTIC ANALYSIS:
      - Analyze the language use and communication style
      - Identify key messaging or persuasive elements
      - Note any storytelling techniques being used
    `
  } = options;

  const genAI = new GoogleGenAI({apiKey});
  
  try {
    // Build the final prompt with additional context if available
    let finalPrompt = prompt;
    
    if (additionalContext) {
      finalPrompt = `
    ${prompt}
    
    ADDITIONAL CONTEXT:
    The video has the following description: "${additionalContext}"
    Please consider this description when analyzing the video content.
    `;
    }
    
    console.log(`Analyzing video with Gemini. Description provided: ${additionalContext ? 'YES' : 'NO'}`);
    
    // Download video and encode as inline base64 (suitable for videos <20MB)
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Video = buffer.toString('base64');
    const result = await genAI.models.generateContent({
      model,
      contents: [
        { inlineData: { mimeType: 'video/mp4', data: base64Video } },
        finalPrompt,
      ],
    });
    
    // Extract text from the response
    const analysisText = extractTextFromResponse(result);
    if (!analysisText) {
      console.error('Failed to extract text from Gemini response:', result);
      throw new Error('Could not extract text from Gemini response');
    }
    
    // Return both the raw response and the extracted text
    return {
      rawResponse: result,
      text: analysisText
    };
  } catch (error) {
    console.error('Error analyzing video with Gemini API:', error);
    throw error;
  }
} 