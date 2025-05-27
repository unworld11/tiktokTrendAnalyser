import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { analysis, videoDescription, author } = await request.json();

    if (!analysis) {
      return NextResponse.json({ error: 'Video analysis is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `
    Based on the following TikTok video analysis, generate 10 authentic and engaging comments that viewers might leave on this video.
    
    Video Analysis:
    ${analysis}
    
    Video Description: ${videoDescription || 'No description provided'}
    Author: @${author}
    
    Requirements for the comments:
    1. Make them sound natural and authentic, like real TikTok users would write
    2. Vary the tone and style - some funny, some supportive, some asking questions
    3. Include appropriate emojis that TikTok users commonly use
    4. Keep them concise (most TikTok comments are short)
    5. Some should reference specific moments or aspects mentioned in the analysis
    6. Avoid being too formal or robotic
    7. Include a mix of:
       - Compliments or positive reactions
       - Relatable responses
       - Questions or requests
       - Funny observations
       - Supportive messages
    8. Use TikTok-style language and abbreviations where appropriate (but not excessively)
    
    Generate exactly 10 comments, each on a new line. Do not number them or add any other formatting.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [prompt],
    });

    // Extract the generated text
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!generatedText) {
      throw new Error('Failed to generate comments');
    }

    // Split the comments by newline and filter out empty lines
    const comments = generatedText
      .split('\n')
      .map(comment => comment.trim())
      .filter(comment => comment.length > 0)
      .slice(0, 10); // Ensure we only return 10 comments

    // If we don't have exactly 10 comments, pad with some generic ones
    while (comments.length < 10) {
      const genericComments = [
        'This is amazing! 🔥',
        'Love this content! ❤️',
        'So good! 😍',
        'Obsessed with this! 💯',
        'Can\'t stop watching! 🤩',
        'This made my day! 😊',
        'Incredible! 👏',
        'Need more of this! 🙌',
        'Perfect! ✨',
        'You\'re the best! 💖'
      ];
      comments.push(genericComments[comments.length % genericComments.length]);
    }

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error generating comments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate comments' },
      { status: 500 }
    );
  }
} 