import { NextResponse } from 'next/server';
import { fetchTikTokVideo } from '../../../lib/apify';
import { analyzeVideoWithAudio } from '../../../lib/geminiAI';

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    console.log('Fetching video data for:', videoUrl);

    // Use the reusable function to fetch video data
    const videoData = await fetchTikTokVideo(videoUrl);
    console.log('Video data fetched successfully');

    // Get the video download URL (without watermark)
    const videoDownloadUrl = videoData.video?.play_addr?.url_list?.[0] || 
                           videoData.video?.download_addr?.url_list?.[0];

    if (!videoDownloadUrl) {
      throw new Error('No video download URL found');
    }

    // Analyze the video with Gemini
    console.log('Analyzing video with Gemini...');
    const analysisResult = await analyzeVideoWithAudio(
      videoDownloadUrl,
      {
        additionalContext: videoData.desc || '',
        prompt: `
        Analyze this TikTok video and provide a comprehensive understanding that will help generate relevant comments.
        
        Focus on:
        1. Main content and theme
        2. Emotional tone and mood
        3. Key moments or highlights
        4. Target audience
        5. Cultural context or trends
        6. What makes this video engaging
        7. Common reactions viewers might have
        
        Be concise but thorough. This analysis will be used to generate authentic-sounding comments.
        `
      }
    );

    return NextResponse.json({
      video: videoData,
      analysis: analysisResult.text
    });

  } catch (error) {
    console.error('Error in video API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 