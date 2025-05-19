import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideoWithAudio } from '@/app/lib/geminiAI';

export async function POST(request: NextRequest) {
  try {
    // Check if Google API Key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API Key is not configured' },
        { status: 500 }
      );
    }
    
    // Parse the request JSON
    const requestData = await request.json();
    const { videoUrl, videoId, videoDesc } = requestData;
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'No video URL provided' },
        { status: 400 }
      );
    }
    
    // Basic URL validation
    let cleanedUrl;
    try {
      // Extract valid URL from the string (sometimes URLs come with params)
      cleanedUrl = videoUrl;
      
      // Check if it's a proper URL
      new URL(cleanedUrl);
      
      // Make sure URL uses HTTPS
      if (cleanedUrl.startsWith('http://')) {
        cleanedUrl = cleanedUrl.replace('http://', 'https://');
      }
      
      // If it's a TikTok web URL, check if we need to modify it
      if (cleanedUrl.includes('tiktok.com') && !cleanedUrl.includes('/video/') && !cleanedUrl.includes('/download/')) {
        // This is likely a share URL, we'll keep it as is for now
        console.log('Processing TikTok share URL:', cleanedUrl);
      }
      
    } catch (e) {
      return NextResponse.json(
        { 
          error: 'Invalid URL format',
          message: 'Please provide a valid video URL'
        },
        { status: 400 }
      );
    }
    
    console.log(`Analyzing video (ID: ${videoId}) with URL: ${cleanedUrl}`);
    if (videoDesc) {
      console.log(`Video description: ${videoDesc}`);
    }
    
    // Try to analyze the video
    try {
      // Analyze the video with description context if available
      const analysisResult = await analyzeVideoWithAudio(cleanedUrl, {
        additionalContext: videoDesc || undefined
      });
      
      // Return success result with analysis data
      return NextResponse.json({
        success: true,
        videoId,
        result: analysisResult.text,
        rawResponse: analysisResult.rawResponse,
      });
    } catch (analysisError) {
      console.error('Error during video analysis:', analysisError);
      
      // Check if this might be a protected/restricted video
      if (String(analysisError).includes('access') || String(analysisError).includes('permission') || 
          String(analysisError).includes('403') || String(analysisError).includes('401')) {
        return NextResponse.json(
          { 
            error: 'Could not access video content',
            details: 'The video might be private, restricted, or requires authentication',
            originalError: analysisError instanceof Error ? analysisError.message : String(analysisError)
          },
          { status: 403 }
        );
      }
      
      throw analysisError;
    }
    
  } catch (error: unknown) {
    console.error('Error in analyze-video API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze video',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 