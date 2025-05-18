import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required parameters
    if (!body.videoId) {
      return NextResponse.json({ error: 'Missing required parameter: videoId' }, { status: 400 });
    }

    // In production, this would:
    // 1. Download the video using videoId
    // 2. Extract audio and pass to a transcription service
    // 3. Analyze the transcript for keywords, topics, etc.
    // 4. Extract on-screen text using OCR (Optical Character Recognition)
    // 5. Combine all data for semantic analysis

    // For development, we'll mock the response with realistic data
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock transcript data
    const transcripts = [
      `Hey everyone! Today I want to talk about my experience with Ozempic. I've been on it for three months now, and I've noticed some side effects I wanted to share. The biggest issue has been constipation - it's been pretty bad. I've also been dealing with serious nutrition gaps. My doctor recommended taking vitamins. Another thing I've noticed is mood swings and fatigue. And the brain fog - sometimes I just can't think clearly!`,
      
      `Week 3 update on my Ozempic journey. I'm noticing some serious nutrition gaps that my doctor warned me about. I've started taking a multivitamin, but I'm still feeling fatigued most days. The constipation is getting better with more water and fiber. Has anyone else dealt with these side effects? Drop a comment below!`,
      
      `The side effects of Ozempic that nobody talks about! I've lost 15 pounds in 2 months, but let me tell you about the constipation issues. And the brain fog? I sometimes forget what I'm saying mid-sentence! My doctor says these are normal, but I wanted to share my real experience with you all.`,
      
      `Ozempic update: Month 2. Weight loss is great, but the side effects are challenging. I've been experiencing serious fatigue and brain fog. My nutritionist recommended these supplements to help with the nutrition gaps. I'll keep you posted on whether they help with the mood swings too!`,
      
      `Things my doctor never told me about Ozempic! The constipation is real, friends. And let's talk about the weird mood swings - one minute I'm fine, the next I'm irritable. Anyone else experiencing nutrition deficiencies? I've started taking B12 and magnesium supplements to help.`
    ];
    
    // Select a transcript based on the video ID (for consistency)
    const videoIdNum = parseInt(body.videoId.replace('video_', '')) || 1;
    const transcriptIndex = (videoIdNum - 1) % transcripts.length;
    const transcript = transcripts[transcriptIndex];
    
    // Extract keywords from transcript
    const keywordPatterns = [
      { term: "ozempic", label: "ozempic" },
      { term: "side effects", label: "side effects" },
      { term: "constipation", label: "constipation" },
      { term: "nutrition gaps", label: "nutrition gaps" },
      { term: "vitamins", label: "supplements" },
      { term: "supplements", label: "supplements" },
      { term: "mood swings", label: "mood swings" },
      { term: "fatigue", label: "fatigue" },
      { term: "brain fog", label: "brain fog" },
      { term: "weight loss", label: "weight loss" },
      { term: "doctor", label: "medical" }
    ];
    
    // Extract keywords present in transcript
    const keywordsFound = keywordPatterns
      .filter(pattern => transcript.toLowerCase().includes(pattern.term))
      .map(pattern => pattern.label);
    
    // Ensure unique keywords
    const keywords = [...new Set(keywordsFound)];
    
    // Determine segments with timestamps
    const segments = transcript.split('. ').map((text, index) => {
      const segmentKeywords = keywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase()));
      
      return {
        text: text.trim() + (text.endsWith('.') ? '' : '.'),
        startTime: index * 5, // Mock timestamp: 5 seconds per segment
        endTime: (index + 1) * 5 - 0.5,
        keywords: segmentKeywords
      };
    });
    
    // Generate mock on-screen text
    const onScreenTextOptions = [
      ['#ozempic', '#weightloss', '#sideeffects', 'Not medical advice'],
      ['#ozempicweightloss', '#GLP1', '#sideeffects', 'Consult your doctor'],
      ['#ozempic', '#weightlossjourney', '#realresults', 'Follow for more health tips'],
      ['#ozempicjourney', '#weightloss', '#sideffectsofozempic', 'Results may vary'],
      ['#weightloss', '#ozempic', '#supplementstotake', 'My personal experience']
    ];
    
    const onScreenText = onScreenTextOptions[transcriptIndex];
    
    // Build the analysis response
    const analysisResult = {
      videoId: body.videoId,
      transcript: transcript,
      onScreenText: onScreenText,
      keywords: keywords,
      textSegments: segments,
      analysisTimestamp: new Date().toISOString()
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing TikTok video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 