# TikTok Semantics

A tool for semantic analysis of TikTok videos, including transcript analysis, keyword extraction, and semantic clustering.

## Features

- Search TikTok videos by keywords
- Semantic analysis dashboard
- Semantic clustering of videos
- Transcript analysis with OpenAI Whisper
- Automatic audio extraction from TikTok videos

## Prerequisites

- Node.js 18+
- FFmpeg for automatic audio extraction
- OpenAI API key for Whisper transcription

## Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Install FFmpeg (required for automatic audio extraction)

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) or install with [Chocolatey](https://chocolatey.org/):
```bash
choco install ffmpeg
```

4. Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Usage

1. Search for TikTok videos using keywords
2. Select a video to analyze
3. Navigate to the "Transcript Analysis" tab
4. Choose either:
   - Automatic extraction: The system will download the video, extract audio, and transcribe it
   - Manual upload: Upload your own audio file from the TikTok video

## Technology Stack

- Next.js 15
- React 19
- OpenAI Whisper API
- FFmpeg for audio extraction
- Tailwind CSS

## Apify Integration

This project integrates with the [Apify](https://apify.com) platform to fetch TikTok data. We use the [novi/fast-tiktok-scraper](https://apify.com/novi/fast-tiktok-scraper) Actor to extract video data.

### Configuration

1. Sign up for an Apify account at [https://apify.com/](https://apify.com/)
2. Obtain your API token from the Apify dashboard
3. Add your token to the `.env.local` file:
   ```
   NEXT_PUBLIC_APIFY_TOKEN=your_apify_token
   ```
4. To use the actual Apify API (costs may apply), set:
   ```
   USE_REAL_API=true
   ```

### Usage Example

```javascript
import { searchTikTokVideos } from './lib/apify';

// Search for TikTok videos
const videos = await searchTikTokVideos({
  type: 'SEARCH',
  region: 'US',
  keywords: ['health', 'wellness'],
  maxItems: 20
});
```

## License

This project is proprietary and confidential.
