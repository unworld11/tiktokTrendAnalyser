# TikTok Semantics

A tool for semantic analysis of TikTok videos, including keyword extraction, semantic clustering, and content analysis with Google Gemini AI.

## Features

- TikTok video search by keywords, hashtags, users, and trends
- Video metadata extraction
- Semantic analysis with Google Gemini AI
- Semantic clustering of videos based on content
- Batch processing for analyzing multiple videos
- Interactive visualizations of semantic patterns

## Requirements

- Node.js 16+ and npm/yarn
- Google Gemini API key for video analysis
- Apify integration for TikTok data scraping

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the following variables:
```
# Apify API Key (required for TikTok data scraping)
APIFY_API_KEY=your_apify_key

# Google Gemini API Key (required for video analysis)
GOOGLE_API_KEY=your_google_api_key
```
4. Start the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter search parameters in the Search Form (keywords, hashtags, etc.)
2. Click "Search" to fetch TikTok videos matching your criteria
3. Navigate to the "Batch Analysis" tab to process videos with Gemini AI
4. Explore semantic patterns in the "Semantic Dashboard" tab

## License

MIT
