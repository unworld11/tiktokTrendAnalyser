import { useState, useEffect } from 'react';

type Video = {
  id?: string;
  aweme_id?: string;
  desc?: string;
  video?: {
    cover?: {
      url_list?: string[];
    };
    origin_cover?: {
      url_list?: string[];
    };
  };
  author?: {
    nickname?: string;
  };
  statistics?: {
    digg_count?: number;
    comment_count?: number;
    play_count?: number;
    share_count?: number;
    // Alternative field names that might be present
    diggCount?: number;
    commentCount?: number;
    playCount?: number;
    shareCount?: number;
  };
};

type VideoResult = {
  videoId: string;
  result: any;
};

type SemanticClusteringProps = {
  videos: Video[];
  geminiResults?: VideoResult[];
  selectedCluster?: string | null;
  onSelectCluster?: (clusterId: string) => void;
};

type ClusterNode = {
  id: string;
  label: string;
  size: number;
  group: number;
  videos: Video[];
  keywords: string[];
};

type Connection = {
  source: string;
  target: string;
  strength: number;
};

export default function SemanticClustering({ 
  videos, 
  geminiResults = [],
  selectedCluster, 
  onSelectCluster 
}: SemanticClusteringProps) {
  const [clusters, setClusters] = useState<ClusterNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (videos.length === 0) return;
    
    setLoading(true);
    console.log("SemanticClustering: Starting clustering with", videos.length, "videos and", geminiResults.length, "Gemini results");
    
    try {
      // Use Gemini results if available, otherwise fallback to basic clustering
      if (geminiResults && geminiResults.length > 0) {
        const themesMap = extractThemesFromGeminiResults(geminiResults, videos);
        
        // Check if any themes were extracted
        if (themesMap.size === 0) {
          console.warn("No themes extracted from Gemini results. Using fallback clustering.");
          setDebugInfo("No themes found in Gemini results - using fallback clustering");
          useFallbackClustering();
          return;
        }
        
        // Convert themes map to clusters
        createClustersFromThemes(themesMap);
      } else {
        console.log("No Gemini results available. Using fallback clustering.");
        setDebugInfo("No Gemini results available - using fallback clustering");
        useFallbackClustering();
      }
    } catch (err) {
      console.error('Error generating clusters:', err);
      setError(`Failed to generate semantic clusters: ${err instanceof Error ? err.message : String(err)}`);
      useFallbackClustering();
    } finally {
      setLoading(false);
    }
  }, [videos, geminiResults]);

  // Extract themes from Gemini results
  const extractThemesFromGeminiResults = (results: VideoResult[], videosList: Video[]) => {
    console.log("Extracting themes from", results.length, "Gemini results");
    const themes = new Map<string, {count: number, videos: Video[], keywords: string[]}>();
    let processedCount = 0;
    
    // Log a sample result for debugging
    if (results.length > 0) {
      console.log("Sample Gemini result structure:", JSON.stringify(results[0], null, 2).substring(0, 500) + "...");
    }
    
    // First pass: extract direct themes from Gemini results
    results.forEach((result, index) => {
      try {
        if (!result.result) {
          console.warn(`Result at index ${index} has no data`);
          return;
        }
        
        let resultText = extractTextFromGeminiResult(result.result);
        
        if (!resultText || resultText.length < 5) {
          console.warn(`Result at index ${index} has insufficient text: "${resultText}"`);
          return;
        }
        
        console.log(`Processing result ${index + 1}/${results.length}, text length: ${resultText.length}`);
        
        // Try different section names that might contain themes
        const possibleSections = ["THEMES & TOPICS", "THEMES AND TOPICS", "THEMES", "TOPICS", "MAIN THEMES", "KEY THEMES", "CONTENT SUMMARY"];
        let themeSection = "";
        
        for (const sectionName of possibleSections) {
          themeSection = extractSection(resultText, sectionName);
          if (themeSection && themeSection.length > 10) {
            console.log(`Found themes in section "${sectionName}", length: ${themeSection.length}`);
            break;
          }
        }
        
        // If no section found, try using the whole text
        if (!themeSection || themeSection.length < 10) {
          console.log("No theme section found, using full text");
          themeSection = resultText;
        }
        
        // Extract themes using multiple methods
        let extractedThemes: string[] = [];
        
        // Method 1: Extract bullet points
        const bulletPointThemes = extractBulletPoints(themeSection);
        if (bulletPointThemes.length > 0) {
          extractedThemes = bulletPointThemes;
          console.log(`Extracted ${extractedThemes.length} themes using bullet points`);
        }
        
        // Method 2: Extract lines with theme indicators
        if (extractedThemes.length === 0) {
          const indicatorThemes = extractLinesWithIndicators(themeSection);
          if (indicatorThemes.length > 0) {
            extractedThemes = indicatorThemes;
            console.log(`Extracted ${extractedThemes.length} themes using theme indicators`);
          }
        }
        
        // Method 3: Split by sentences as last resort
        if (extractedThemes.length === 0) {
          extractedThemes = themeSection.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
          console.log(`Extracted ${extractedThemes.length} themes by splitting sentences`);
        }

        // Method 4: Look for hashtags as themes
        const hashtagMatch = resultText.match(/#(\w+)/g);
        if (hashtagMatch && hashtagMatch.length > 0) {
          const hashtagThemes = hashtagMatch
            .map(tag => tag.replace('#', ''))
            .filter(tag => tag.length > 3)
            .map(tag => `${tag.charAt(0).toUpperCase() + tag.slice(1)} Content`);
          
          extractedThemes = [...extractedThemes, ...hashtagThemes];
          console.log(`Added ${hashtagThemes.length} hashtag themes`);
        }
        
        // Filter out themes that are too long or too short
        extractedThemes = extractedThemes.filter(theme => 
          theme.length > 3 && theme.length < 100
        );
        
        if (extractedThemes.length > 0) {
          processedCount++;
          
          // Group by each theme (we'll use more than just the primary one)
          const maxThemes = Math.min(3, extractedThemes.length); // Use up to 3 themes per video
          for (let i = 0; i < maxThemes; i++) {
            const theme = extractedThemes[i];
            const relatedVideo = findVideoById(videosList, result.videoId);
            
            if (relatedVideo) {
              // Process the theme
              const themeData = themes.get(theme) || {count: 0, videos: [], keywords: []};
              themeData.count += 1;
              themeData.videos.push(relatedVideo);
              
              // Extract keywords from the theme
              const keywords = theme
                .toLowerCase()
                .split(/[,\s]/) // Split by commas and spaces
                .map(w => w.trim())
                .filter(word => word.length > 3 && word !== "with" && word !== "this" && word !== "that");
              
              themeData.keywords = [...new Set([...themeData.keywords, ...keywords])];
              themes.set(theme, themeData);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing result ${index}:`, err);
      }
    });
    
    // Second pass: if we have few themes, extract additional themes from video descriptions
    if (themes.size < 3 && videosList.length > 0) {
      console.log("Found only", themes.size, "themes. Extracting additional themes from video descriptions.");
      
      // Create content-based themes from video descriptions
      const descriptionThemes = extractThemesFromDescriptions(videosList);
      
      // Add description-based themes to our theme map
      descriptionThemes.forEach((data, theme) => {
        if (!themes.has(theme)) {
          themes.set(theme, data);
        }
      });
      
      console.log(`Added ${descriptionThemes.size} additional themes from descriptions`);
    }
    
    console.log(`Successfully extracted themes from ${processedCount}/${results.length} results`);
    console.log(`Generated ${themes.size} unique themes`);
    setDebugInfo(`Processed ${processedCount}/${results.length} results, found ${themes.size} themes`);
    
    return themes;
  };

  // Extract themes from video descriptions when Gemini themes are limited
  const extractThemesFromDescriptions = (videosList: Video[]): Map<string, {count: number, videos: Video[], keywords: string[]}> => {
    const descriptionThemes = new Map<string, {count: number, videos: Video[], keywords: string[]}>();
    
    // Common theme categories for content analysis
    const themeCategories = [
      { name: "Educational Content", keywords: ["learn", "how to", "tutorial", "explain", "tip", "advice", "guide"] },
      { name: "Entertainment", keywords: ["funny", "laugh", "comedy", "fun", "humor", "joke", "prank"] },
      { name: "Lifestyle & Fashion", keywords: ["fashion", "style", "outfit", "clothing", "beauty", "makeup", "skincare"] },
      { name: "Food & Cooking", keywords: ["food", "recipe", "cook", "meal", "restaurant", "eating", "diet"] },
      { name: "Health & Fitness", keywords: ["fitness", "workout", "exercise", "health", "gym", "training", "wellness"] },
      { name: "Travel & Adventure", keywords: ["travel", "trip", "vacation", "journey", "adventure", "explore", "destination"] },
      { name: "Technology & Gadgets", keywords: ["tech", "technology", "gadget", "device", "review", "phone", "computer"] },
      { name: "Music & Dance", keywords: ["music", "song", "dance", "singing", "concert", "artist", "performer"] },
      { name: "Social Media Trends", keywords: ["trend", "challenge", "viral", "popular", "trending", "famous"] }
    ];
    
    // Group videos by theme categories
    videosList.forEach(video => {
      const desc = video.desc?.toLowerCase() || '';
      
      // Skip empty descriptions
      if (!desc) return;
      
      // Match video to themes
      themeCategories.forEach(category => {
        // Check if any category keywords appear in the description
        if (category.keywords.some(keyword => desc.includes(keyword))) {
          // Add video to this theme
          const themeData = descriptionThemes.get(category.name) || {count: 0, videos: [], keywords: []};
          themeData.count += 1;
          themeData.videos.push(video);
          themeData.keywords = [...new Set([...themeData.keywords, ...category.keywords])];
          descriptionThemes.set(category.name, themeData);
        }
      });
    });
    
    return descriptionThemes;
  };

  // Helper to find video by ID in different formats
  const findVideoById = (videosList: Video[], videoId: string): Video | undefined => {
    return videosList.find(v => 
      v.id === videoId || 
      v.aweme_id === videoId || 
      String(v.id) === videoId || 
      String(v.aweme_id) === videoId
    );
  };

  // Helper to extract bullet points
  const extractBulletPoints = (text: string): string[] => {
    const bulletRegex = /(?:^|\n)\s*[-•*+]\s*(.*?)(?=\n\s*[-•*+]|\n\s*\n|$)/g;
    const numberedRegex = /(?:^|\n)\s*\d+[.)\]]\s*(.*?)(?=\n\s*\d+[.)\]]|\n\s*\n|$)/g;
    
    const bulletMatches = Array.from(text.matchAll(bulletRegex)).map(match => match[1].trim());
    const numberedMatches = Array.from(text.matchAll(numberedRegex)).map(match => match[1].trim());
    
    return [...bulletMatches, ...numberedMatches];
  };
  
  // Helper to extract lines with theme indicators
  const extractLinesWithIndicators = (text: string): string[] => {
    const lines = text.split('\n').map(line => line.trim());
    const themeIndicators = ['theme', 'topic', 'about', 'focuses', 'focus', 'discuss', 'content', 'video is'];
    
    return lines.filter(line => 
      line.length > 10 && 
      themeIndicators.some(indicator => 
        line.toLowerCase().includes(indicator)
      )
    );
  };

  // Extract text from Gemini results in various formats
  const extractTextFromGeminiResult = (result: any): string => {
    // If it's already a string, use it directly
    if (typeof result === 'string') {
      return result;
    }
    
    // If it has a text property
    if (result.text) {
      return result.text;
    }
    
    // API response format with candidates
    if (result.rawResponse?.candidates?.[0]?.content?.parts) {
      return result.rawResponse.candidates[0].content.parts
        .map((part: any) => part.text || '')
        .join('\n');
    }
    
    // Direct candidates array
    if (result.candidates) {
      const textParts: string[] = [];
      
      result.candidates.forEach((candidate: any) => {
        if (candidate.content?.parts) {
          candidate.content.parts.forEach((part: any) => {
            if (part.text) {
              textParts.push(part.text);
            }
          });
        }
      });
      
      if (textParts.length > 0) {
        return textParts.join('\n');
      }
    }
    
    // Try to stringify the entire object
    try {
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return '';
    }
  };

  // Helper function to extract a section from Gemini results
  const extractSection = (text: string, sectionName: string): string => {
    // Case insensitive search for the section name
    const escapedSectionName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionPattern = new RegExp(`${escapedSectionName}[:\\s]*((?:.|\\n)*?)(?:\\n\\s*\\n|\\n\\s*[A-Z\\s]{2,}:|$)`, 'i');
    const match = text.match(sectionPattern);
    
    return match ? match[1].trim() : '';
  };
  
  // Create clusters from extracted themes
  const createClustersFromThemes = (themes: Map<string, {count: number, videos: Video[], keywords: string[]}>) => {
    // Convert themes map to clusters
    let clusterIndex = 0;
    const themeClusters: ClusterNode[] = Array.from(themes.entries())
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5) // Limit to top 5 themes
      .map(([theme, data], idx) => {
        clusterIndex++;
        // Clean up theme names
        const cleanTheme = theme
          .replace(/^TOPICS:?\s*/i, '')
          .replace(/^THEMES:?\s*/i, '')
          .replace(/(\d+\.?\s*)/, '')
          .trim();
          
        return {
          id: `cluster-${cleanTheme.replace(/\s+/g, '-').toLowerCase().substring(0, 20)}`,
          label: cleanTheme.length > 15 ? cleanTheme.substring(0, 15) + '...' : cleanTheme,
          size: data.count,
          group: clusterIndex,
          videos: data.videos,
          keywords: data.keywords
        };
      });
    
    console.log(`Created ${themeClusters.length} clusters`);
    
    // If we still have too few clusters, create additional ones from video statistics
    if (themeClusters.length < 2 && videos.length > 1) {
      console.log("Too few theme clusters, adding engagement-based clusters");
      
      // Create engagement-based clusters (popular vs. less popular)
      const popularityThreshold = calculateMedianEngagement(videos);
      const popularVideos = videos.filter(v => getVideoEngagement(v) > popularityThreshold);
      const lessPopularVideos = videos.filter(v => getVideoEngagement(v) <= popularityThreshold);
      
      if (popularVideos.length > 0) {
        clusterIndex++;
        themeClusters.push({
          id: 'cluster-high-engagement',
          label: 'Higher Engagement',
          size: popularVideos.length,
          group: clusterIndex,
          videos: popularVideos,
          keywords: ['popular', 'viral', 'trending', 'high engagement']
        });
      }
      
      if (lessPopularVideos.length > 0) {
        clusterIndex++;
        themeClusters.push({
          id: 'cluster-lower-engagement',
          label: 'Lower Engagement',
          size: lessPopularVideos.length,
          group: clusterIndex,
          videos: lessPopularVideos,
          keywords: ['emerging', 'niche', 'lower engagement']
        });
      }
      
      console.log("Added engagement-based clusters");
    }
    
    if (themeClusters.length === 0) {
      console.warn("No theme clusters created, falling back");
      useFallbackClustering();
      return;
    }
    
    // Create connections between clusters based on keyword similarity
    const themeConnections: Connection[] = [];
    
    for (let i = 0; i < themeClusters.length; i++) {
      for (let j = i + 1; j < themeClusters.length; j++) {
        const cluster1 = themeClusters[i];
        const cluster2 = themeClusters[j];
        
        // Calculate connection strength based on common keywords
        const commonKeywords = cluster1.keywords.filter(kw => 
          cluster2.keywords.includes(kw)
        );
        
        if (commonKeywords.length > 0) {
          const strength = commonKeywords.length / 
            Math.max(cluster1.keywords.length, cluster2.keywords.length);
          
          themeConnections.push({
            source: cluster1.id,
            target: cluster2.id,
            strength: Math.min(0.9, strength + 0.2) // Ensure visible connections
          });
        } else {
          // Always add at least a weak connection between clusters for better visualization
          themeConnections.push({
            source: cluster1.id,
            target: cluster2.id,
            strength: 0.1 + (Math.random() * 0.2) // Weak connection with some randomness
          });
        }
      }
    }
    
    setClusters(themeClusters);
    setConnections(themeConnections);
  };
  
  // Calculate median engagement score for videos
  const calculateMedianEngagement = (videosList: Video[]): number => {
    const engagementScores = videosList.map(getVideoEngagement).sort((a, b) => a - b);
    
    if (engagementScores.length === 0) return 0;
    
    const midIndex = Math.floor(engagementScores.length / 2);
    
    return engagementScores.length % 2 === 0
      ? (engagementScores[midIndex - 1] + engagementScores[midIndex]) / 2
      : engagementScores[midIndex];
  };
  
  // Get engagement score for a video (sum of likes, comments, shares)
  const getVideoEngagement = (video: Video): number => {
    const stats = video.statistics || {};
    
    // Handle different stat field names
    const likes = stats.digg_count || stats.diggCount || 0;
    const comments = stats.comment_count || stats.commentCount || 0;
    const shares = stats.share_count || stats.shareCount || 0;
    const plays = stats.play_count || stats.playCount || 0;
    
    return likes + comments + shares + (plays / 1000); // Scale down play count
  };

  // Use fallback clustering when Gemini data isn't usable
  const useFallbackClustering = () => {
    console.log("Using fallback clustering for", videos.length, "videos");
    
    // Group videos by description similarity
    const videoGroups: Record<string, Video[]> = {};
    
    videos.forEach(video => {
      const desc = video.desc?.toLowerCase() || '';
      
      // Simple grouping based on common words in description
      let groupKey = 'misc';
      
      const keywordSets = [
        { key: 'group1', words: ['how', 'what', 'why', 'tutorial', 'guide'] },
        { key: 'group2', words: ['new', 'review', 'unboxing', 'product'] },
        { key: 'group3', words: ['funny', 'comedy', 'laugh', 'joke'] }
      ];
      
      for (const set of keywordSets) {
        if (set.words.some(word => desc.includes(word))) {
          groupKey = set.key;
          break;
        }
      }
      
      if (!videoGroups[groupKey]) {
        videoGroups[groupKey] = [];
      }
      
      videoGroups[groupKey].push(video);
    });
    
    // Convert groups to clusters
    const fallbackClusters: ClusterNode[] = Object.entries(videoGroups)
      .filter(([_, groupVideos]) => groupVideos.length > 0)
      .map(([key, groupVideos], index) => {
        // Create more meaningful labels
        const groupLabels: Record<string, string> = {
          'group1': 'How-to & Guides',
          'group2': 'Reviews & Products',
          'group3': 'Entertainment',
          'misc': 'Miscellaneous'
        };
        
        return {
          id: `cluster-${key}`,
          label: groupLabels[key] || `Group ${index + 1}`,
          size: groupVideos.length,
          group: index + 1,
          videos: groupVideos,
          keywords: [key, 'content', 'videos']
        };
      });
    
    // Create simple connections
    const fallbackConnections: Connection[] = [];
    
    for (let i = 0; i < fallbackClusters.length; i++) {
      for (let j = i + 1; j < fallbackClusters.length; j++) {
        fallbackConnections.push({
          source: fallbackClusters[i].id,
          target: fallbackClusters[j].id, 
          strength: 0.3 + Math.random() * 0.4 // Random strength for visual interest
        });
      }
    }
    
    setClusters(fallbackClusters);
    setConnections(fallbackConnections);
  };

  if (videos.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Search for videos to see semantic clustering
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Semantic Clustering</h3>
        {debugInfo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{debugInfo}</p>
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
          <h3 className="text-sm font-medium mb-1">About Semantic Clustering</h3>
          <p className="text-sm">Videos are semantically clustered based on themes and topics identified by Gemini.</p>
        </div>
        
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {clusters.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-4 rounded-md">
                <p>No clusters could be formed. Try processing more videos with Gemini first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visualization */}
                <div className="border rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm min-h-64 flex items-center justify-center">
                  <div className="w-full aspect-square relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {clusters.map((cluster, idx) => {
                        // Position clusters in a circle
                        const angle = (idx / clusters.length) * 2 * Math.PI;
                        const radius = 120; // pixels from center
                        const left = 150 + radius * Math.cos(angle);
                        const top = 150 + radius * Math.sin(angle);
                        
                        const size = 30 + (cluster.size / Math.max(...clusters.map(c => c.size))) * 50;
                        
                        // Different colors for different groups
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
                        const color = colors[cluster.group % colors.length];
                        
                        return (
                          <div
                            key={cluster.id}
                            className={`absolute rounded-full flex items-center justify-center cursor-pointer
                              transition-all duration-200 ${color} text-white
                              hover:ring-2 hover:ring-indigo-200
                              ${selectedCluster === cluster.id ? 'ring-4 ring-indigo-300' : ''}`}
                            style={{
                              left: `${left}px`,
                              top: `${top}px`,
                              width: `${size}px`,
                              height: `${size}px`,
                              fontSize: `${Math.max(9, size / 5)}px`,
                            }}
                            onClick={() => onSelectCluster && onSelectCluster(cluster.id)}
                          >
                            {cluster.label}
                          </div>
                        );
                      })}
                      
                      {/* Draw connections between clusters */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {connections.map((conn, idx) => {
                          const sourceCluster = clusters.find(c => c.id === conn.source);
                          const targetCluster = clusters.find(c => c.id === conn.target);
                          
                          if (!sourceCluster || !targetCluster) return null;
                          
                          // Calculate positions based on cluster positions
                          const sourceIdx = clusters.findIndex(c => c.id === conn.source);
                          const targetIdx = clusters.findIndex(c => c.id === conn.target);
                          
                          const sourceAngle = (sourceIdx / clusters.length) * 2 * Math.PI;
                          const targetAngle = (targetIdx / clusters.length) * 2 * Math.PI;
                          
                          const radius = 120;
                          const sourceX = 150 + radius * Math.cos(sourceAngle);
                          const sourceY = 150 + radius * Math.sin(sourceAngle);
                          const targetX = 150 + radius * Math.cos(targetAngle);
                          const targetY = 150 + radius * Math.sin(targetAngle);
                          
                          return (
                            <line 
                              key={idx} 
                              x1={sourceX} 
                              y1={sourceY} 
                              x2={targetX} 
                              y2={targetY}
                              stroke="rgba(156, 163, 175, 0.5)"
                              strokeWidth={conn.strength * 5}
                              strokeDasharray={conn.strength < 0.4 ? "3,3" : ""}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Cluster Details */}
                <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      {selectedCluster 
                        ? clusters.find(c => c.id === selectedCluster)?.label || 'Cluster Details'
                        : 'Select a cluster to see details'}
                    </h4>
                  </div>
                  
                  {selectedCluster ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Top Keywords
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const selectedClusterData = clusters.find(c => c.id === selectedCluster);
                            let clusterKeywords: string[] = selectedClusterData?.keywords || [];
                            
                            if (clusterKeywords.length === 0) {
                              // Fallback keywords if none available
                              clusterKeywords = ['no', 'keywords', 'available'];
                            }
                            
                            return clusterKeywords.slice(0, 8).map((keyword, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs dark:bg-indigo-900 dark:text-indigo-200"
                              >
                                {keyword}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Videos in Cluster
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {clusters.find(c => c.id === selectedCluster)?.size || 0} videos in this cluster
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {clusters.find(c => c.id === selectedCluster)?.videos.slice(0, 3).map((video, idx) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                              {video.desc || `Video ${idx + 1}`}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Connected Clusters
                        </h5>
                        <div className="space-y-2">
                          {connections
                            .filter(conn => conn.source === selectedCluster || conn.target === selectedCluster)
                            .map((conn, idx) => {
                              const connectedClusterId = conn.source === selectedCluster ? conn.target : conn.source;
                              const connectedCluster = clusters.find(c => c.id === connectedClusterId);
                              
                              return (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {connectedCluster?.label}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500" 
                                        style={{ width: `${conn.strength * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {Math.round(conn.strength * 100)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-center h-48">
                      <p className="text-gray-500 dark:text-gray-400">
                        Click on a cluster to view details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 