# TikTok Semantics

A tool for semantic analysis of TikTok videos, including keyword extraction, semantic clustering, and content analysis with Google Gemini AI.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **TikTok Video Search:** Effortlessly find relevant TikTok videos. You can search using keywords, hashtags, specific user accounts, or currently trending topics. This allows for targeted content discovery, making it easier to find videos for analysis.
- **Video Metadata Extraction:** Automatically gather essential information about each video. This includes details like video titles, descriptions, view counts, likes, comments, and author information. This data provides valuable context for your semantic analysis.
- **Semantic Analysis with Google Gemini AI:** Leverage the power of Google's cutting-edge Gemini AI to understand the deeper meaning of video content. This feature goes beyond simple keywords, enabling nuanced comprehension of themes, topics, and sentiments expressed in the videos.
- **Semantic Clustering of Videos:** Group videos based on their semantic similarity. Using the insights from Gemini AI, the tool identifies videos with related themes and topics, helping you discover patterns and trends within large datasets of TikTok content.
- **Batch Processing:** Analyze multiple TikTok videos simultaneously. This significantly speeds up the research process, allowing you to efficiently process large volumes of content without manual intervention for each video.
- **Interactive Visualizations:** Explore semantic patterns through intuitive and dynamic charts and graphs. These visual tools make it easier to understand complex relationships between videos, identify emerging trends, and present your findings in an engaging way.

## Technologies Used

This project leverages a modern tech stack to deliver its features:

### Frontend
- **Next.js:** A React framework for building server-side rendered (SSR) and statically generated web applications. It provides a robust foundation for the user interface and client-side interactions.
- **React:** A JavaScript library for building user interfaces, used for creating dynamic and interactive components.
- **TypeScript:** A superset of JavaScript that adds static typing, helping to write more maintainable and error-free code.
- **Tailwind CSS:** A utility-first CSS framework for rapidly building custom user interfaces, allowing for efficient styling and responsive design.

### Backend
- **Node.js:** A JavaScript runtime environment used for backend logic, API handling, and server-side operations.

### AI/ML
- **Google Gemini AI:** Utilized for advanced semantic analysis of video content.
    - **`@google-cloud/vertexai`:** Google Cloud's Vertex AI SDK, enabling integration with powerful AI models.
    - **`@google/genai`:** The Google AI JavaScript SDK, providing tools to interact with generative AI models like Gemini.
- **Groq SDK (`groq-sdk`):** Enables integration with Groq's Language Processing Unit (LPU) for fast AI inference.
- **OpenAI SDK (`openai`):** Allows interaction with OpenAI's suite of AI models, offering alternative or complementary AI capabilities.

### Data Scraping
- **Apify (`apify-client`):** A client library for the Apify platform, used for web scraping and extracting data from TikTok.

### Database/Storage
- **Supabase:** An open-source Firebase alternative providing database storage, authentication, and other backend services.
    - **`@supabase/ssr`:** Utilities for server-side rendering with Supabase.
    - **`@supabase/supabase-js`:** The official JavaScript client library for interacting with Supabase.

### Video Processing
- **`ffmpeg-static`:** A static build of FFmpeg, a complete, cross-platform solution to record, convert, and stream audio and video.

### Others
- **Axios (`axios`):** A promise-based HTTP client for making API requests.
- **ESLint (`eslint`):** A pluggable and configurable linter tool for identifying and reporting on patterns in code, ensuring code quality.
- **Vercel (`vercel`):** A platform for deploying and hosting frontend applications, particularly well-suited for Next.js projects.

## Requirements

- Node.js 20.x or higher (as specified in `package.json`).
- `npm` or `yarn` for package management.
- Google Gemini API key for video analysis.
- Apify API key for TikTok data scraping.
- A Supabase project for database and storage.

## Getting Started

Follow these steps to get the project up and running on your local machine.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/tiktok-semantics.git
    cd tiktok-semantics
    ```
    *(Note: Replace `your-username/tiktok-semantics` with the actual repository URL if you are cloning the main project, or your fork's URL.)*

2.  **Install Dependencies:**
    Ensure you have Node.js version 20.x or higher installed. Use `npm` or `yarn` to install project dependencies:
    ```bash
    npm install
    # OR
    # yarn install
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the root of your project by copying the `example.env` file:
    ```bash
    cp example.env .env
    ```
    Then, populate the `.env` file with your API keys and credentials:
    ```env
    # Apify API Key (required for TikTok data scraping)
    # Find this in your Apify account settings.
    APIFY_API_KEY=your_apify_key

    # Google Gemini API Key (required for video analysis)
    # Obtain this from your Google Cloud Console.
    GOOGLE_API_KEY=your_google_api_key

    # Supabase Project URL (required for database and storage)
    # Find this in your Supabase project settings (Settings > API > Project URL).
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

    # Supabase Anon Key (required for client-side access to Supabase)
    # Find this in your Supabase project settings (Settings > API > Project API keys > anon public).
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    **Note:** Ensure Supabase variables intended for client-side use are prefixed with `NEXT_PUBLIC_`. Refer to your Supabase project dashboard for the correct URL and keys.

4.  **Database Setup (if applicable):**
    If your Supabase project requires a specific schema or initial data, you might need to run database migrations. Check the Supabase dashboard for your project or any provided migration scripts. (This project does not currently include automated migration scripts in the repository).

5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`.

6.  **Open in Browser:**
    Open [http://localhost:3000](http://localhost:3000) in your web browser to see the application.

## Usage

This application provides two main ways to interact with its features: through the Web Interface and via direct script execution for developers.

### Using the Web Interface

The primary way to use TikTok Semantics is through its user-friendly web interface, accessible after starting the development server.

1.  **Navigate to the Application:**
    Open your browser and go to `http://localhost:3000` (or the port shown when you run `npm run dev`).

2.  **Perform a TikTok Video Search:**
    -   Locate the **Search Form**.
    -   Enter your desired search parameters. Examples:
        -   **Keywords:** "DIY crafts", "cooking hacks"
        -   **Hashtags:** "#techreview", "#travelbucketlist"
        -   **Usernames:** "@username"
    -   Click the "Search" or "Fetch Videos" button.

3.  **Batch Analyze Videos with Gemini AI:**
    -   Navigate to the **"Batch Analysis"** tab.
    -   Select the videos you want to analyze.
    -   Initiate the analysis. This may take some time depending on the number of videos.

4.  **Explore Semantic Patterns:**
    -   Go to the **"Semantic Dashboard"** or "Results" tab.
    -   Explore interactive visualizations to understand themes and trends.

### Using the Example Analysis Script (For Developers)

The project includes an example script (`examples/video-analysis-example.js`) demonstrating direct use of the Google Gemini API.

**Prerequisites:**
- Ensure your `.env` file is correctly set up with `GOOGLE_API_KEY`.
- The script uses Node.js and ES modules.

**Running the Script:**
```bash
node examples/video-analysis-example.js
```

**What the script does:**
- Initializes the Google Gemini AI client.
- Provides functions:
    - `analyzeVideoFromFile(videoPath)`: Analyzes a local video file (modify path as needed).
    - `analyzeVideoFromUrl(videoUrl)`: Analyzes a video from a URL (replace placeholder URL).
- Prints the analysis to the console.

**Customizing the Script:**
- Modify `videoPath` or `videoUrl` in the `main()` function.
- Change the prompt passed to the Gemini model for different analyses.

## Project Structure

The project uses a Next.js App Router structure. Key directories:

-   **`src/`**: Core source code.
    -   **`src/app/`**: Next.js App Router.
        -   **`src/app/api/`**: Backend API route handlers (e.g., `search/`, `analyze/`).
        -   **`src/app/components/`**: Reusable React components.
        -   **`src/app/lib/`**: Shared utilities and client libraries (e.g., `apify.ts`, `geminiAI.ts`).
        -   **`src/app/<routegroup>/page.tsx`**: Defines pages (e.g., `src/app/page.tsx` is the homepage).
    -   **`src/middleware.ts`**: Next.js middleware.

-   **`public/`**: Static assets.
    -   **`public/data/`**: Static data files (e.g., `videos.json`).
    -   **`public/transcriptions/`**: Video transcription outputs.

-   **`examples/`**: Example scripts like `video-analysis-example.js`.

-   **Configuration Files**:
    -   `next.config.mjs` (or `.ts`): Next.js configuration.
    -   `package.json`: Project dependencies and scripts.
    -   `tsconfig.json`: TypeScript configuration.
    -   `example.env`: Example environment variables (copy to `.env`).
    -   `eslint.config.mjs` (or `.eslintrc.json`): ESLint configuration.

## Contributing

We welcome contributions! Please review these guidelines.

### Reporting Bugs
-   **Check Existing Issues:** Before creating a new issue, search [GitHub Issues](https://github.com/your-username/tiktok-semantics/issues) *(replace with actual link)* to see if the bug is already reported.
-   **Provide Detailed Information:** If new, create an issue with:
    -   A clear title.
    -   Steps to reproduce.
    -   Expected vs. actual behavior.
    -   Environment details (Node.js version, OS, browser).

### Suggesting Enhancements
-   **Check Existing Discussions:** Search [GitHub Issues](https://github.com/your-username/tiktok-semantics/issues) and [Discussions](https://github.com/your-username/tiktok-semantics/discussions) *(replace with actual links)*.
-   **Open an Issue:** If new, open an issue to describe your suggestion, its benefits, and potential implementation ideas.

### Pull Request Process
1.  **Fork** the repository.
2.  **Create a New Branch:** (`git checkout -b feature/your-feature-name`).
3.  **Make Changes.**
4.  **Ensure Code Quality:** Run linter (`npm run lint`) and tests (if applicable).
5.  **Commit** your changes with clear messages.
6.  **Push** to your fork (`git push origin feature/your-feature-name`).
7.  **Submit a Pull Request (PR)** to the `main` branch of the original repository with a clear title and description.

## Troubleshooting

If you encounter problems:

### General Advice
1.  **Environment Variables:** Verify your `.env` file is correct and all required variables are present.
2.  **Dependencies:** Run `npm install` (or `yarn install`) again. Consider `rm -rf node_modules && npm install`.
3.  **API Keys:** Confirm keys for Apify, Google Gemini, and Supabase are active, have correct permissions, and are not expired.
4.  **Browser Console:** Check for frontend JavaScript errors.
5.  **Server Logs:** Review logs from `npm run dev` for backend errors.

### Common Issues
-   **Apify Scraping:** Check `APIFY_API_KEY`, actor limits, TikTok site changes, network.
-   **Gemini AI Analysis:** Check `GOOGLE_API_KEY`, Vertex AI API status, permissions, quotas, input format, model name.
-   **Supabase Connection:** Check `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, network, RLS policies, project status.
-   **Installation/Dependency:** Check Node.js version (20.x+), consider reinstalling `node_modules`.

### Further Help
If issues persist, check [GitHub Issues](https://github.com/your-username/tiktok-semantics/issues) *(replace with actual link)* or open a new, detailed issue.

## License

MIT
