/**
 * Example of video analysis using the Gemini API directly
 * This demonstrates proper API key configuration and different ways to handle video content
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import path from "path";
import "dotenv/config"; // For loading .env file

// Option 1: Using environment variable (recommended)
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY environment variable is not set");
}

// Initialize the Gemini client
const genAI = new GoogleGenAI(apiKey);

/**
 * Analyze a video using a direct file (base64 encoding)
 */
async function analyzeVideoFromFile(videoPath) {
  try {
    // Read the file as base64
    const base64VideoFile = fs.readFileSync(videoPath, {
      encoding: "base64",
    });

    // Set up the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create content with the video and prompt
    const result = await model.generateContent([
      "Please analyze this TikTok video and describe what's happening.",
      {
        inlineData: {
          mimeType: "video/mp4",
          data: base64VideoFile,
        },
      },
    ]);

    console.log("Video Analysis:", result.response.text());
    return result.response;
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

/**
 * Analyze a video from a URL
 */
async function analyzeVideoFromUrl(videoUrl) {
  try {
    // Set up the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create content with the video URL and prompt
    const result = await model.generateContent([
      "Please analyze this TikTok video and describe what's happening.",
      {
        fileData: {
          fileUri: videoUrl,
        },
      },
    ]);

    console.log("Video Analysis:", result.response.text());
    return result.response;
  } catch (error) {
    console.error("Error analyzing video from URL:", error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  // Example 1: Analyze a local video file
  // const videoPath = path.join(__dirname, "sample-video.mp4");
  // await analyzeVideoFromFile(videoPath);

  // Example 2: Analyze a video from URL
  await analyzeVideoFromUrl("https://example.com/sample-video.mp4");
}

// Run the example
main().catch(console.error); 