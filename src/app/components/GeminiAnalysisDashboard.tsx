import { useState, useEffect } from 'react';

type GeminiAnalysisResult = {
  videoId: string;
  result: any; // Changed from string to any to handle different result formats
};

type GeminiDashboardProps = {
  results: GeminiAnalysisResult[];
  isLoading?: boolean;
  onProcessingComplete?: () => void;
};

type InsightItem = {
  category: string;
  count: number;
  examples: string[];
};

type KeywordRelation = {
  source: string;
  target: string;
  weight: number;
};

export default function GeminiAnalysisDashboard({ 
  results, 
  isLoading = false,
  onProcessingComplete 
}: GeminiDashboardProps) {
  const [themes, setThemes] = useState<InsightItem[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [semanticRelations, setSemanticRelations] = useState<KeywordRelation[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (results.length > 0) {
      setProcessing(true);
      // Use setTimeout to allow the UI to update before starting the processing
      // This ensures the loading state is visible
      setTimeout(() => {
        try {
          console.log("Starting to process results:", results.length);
          processGeminiResults();
        } catch (err) {
          console.error("Error processing Gemini results:", err);
          setError(err instanceof Error ? err.message : "Unknown error processing results");
          setProcessing(false);
        }
      }, 100);
    }
  }, [results]);

  const extractSection = (text: string, sectionName: string): string => {
    try {
      if (!text) return '';
      
      // Try different regex patterns to match section headers
      const patterns = [
        // Pattern 1: Standard numbered section with colon (e.g. "7. SEMANTIC ANALYSIS:")
        new RegExp(`[\\d\\.\\s]*${sectionName}[:\\s\\n]+(.*?)(?:[\\d\\.]+\\s*\\w+[:\\s\\n]|$)`, 'is'),
        
        // Pattern 2: Section with asterisks (e.g. "**SEMANTIC ANALYSIS**")
        new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s\\n]+(.*?)(?:\\*\\*|[\\d\\.]+\\s*\\w+[:\\s\\n]|$)`, 'is'),
        
        // Pattern 3: Section with hashtags (e.g. "# SEMANTIC ANALYSIS")
        new RegExp(`#\\s*${sectionName}[:\\s\\n]+(.*?)(?:#|[\\d\\.]+\\s*\\w+[:\\s\\n]|$)`, 'is'),
        
        // Pattern 4: Just look for the section name and take everything until the next section
        new RegExp(`${sectionName}[:\\s\\n]+(.*?)(?:[A-Z\\s&]{3,}:|$)`, 'is')
      ];
      
      // Try each pattern until one works
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].trim().length > 0) {
          console.log(`Found ${sectionName} using pattern: ${pattern}`);
          return match[1].trim();
        }
      }
      
      // Fallback: just search for lines containing relevant keywords
      if (sectionName.includes("THEMES")) {
        // For themes, look for hashtags, topics, or theme-related content
        const themeKeywords = /#\w+|topic|theme|trend|subject|content|about/i;
        const lines = text.split('\n')
          .filter(line => themeKeywords.test(line))
          .join('\n');
        
        if (lines.length > 0) {
          console.log(`Found THEMES using keyword fallback`);
          return lines;
        }
      } else if (sectionName.includes("SEMANTIC")) {
        // For semantic analysis, look for language, communication, or message-related content
        const semanticKeywords = /language|communication|message|storytelling|narrative|persuasive|tone|style/i;
        const lines = text.split('\n')
          .filter(line => semanticKeywords.test(line))
          .join('\n');
        
        if (lines.length > 0) {
          console.log(`Found SEMANTIC using keyword fallback`);
          return lines;
        }
      }
      
      console.warn(`Could not extract ${sectionName} with any pattern`);
      return '';
    } catch (err) {
      console.error(`Error extracting section ${sectionName}:`, err);
      return '';
    }
  };

  const processGeminiResults = () => {
    console.log("Processing Gemini results...");
    
    if (!results || results.length === 0) {
      console.warn("No results to process");
      setProcessing(false);
      return;
    }
    
    // Extract and collect all keywords
    const keywordSet = new Set<string>();
    const themeMap = new Map<string, { count: number; examples: string[] }>();
    const relationMap = new Map<string, Map<string, number>>();
    
    results.forEach((resultItem, index) => {
      try {
        console.log(`Processing result ${index + 1}/${results.length}, videoId: ${resultItem.videoId}`);
        
        if (!resultItem.result) {
          console.warn(`Result at index ${index} has no result data`);
          return;
        }
        
        // Extract text content from result (it could be in different formats)
        let resultText = '';
        
        if (typeof resultItem.result === 'string') {
          // If it's already a string, use it directly
          resultText = resultItem.result;
        } else if (resultItem.result.text) {
          // If it has a text property, use that
          resultText = resultItem.result.text;
        } else if (resultItem.result.rawResponse && resultItem.result.rawResponse.candidates) {
          // Try to get text from the rawResponse structure
          const candidates = resultItem.result.rawResponse.candidates;
          if (candidates[0]?.content?.parts) {
            resultText = candidates[0].content.parts[0].text || '';
          }
        } else if (resultItem.result.candidates) {
          // Direct candidates array
          const candidates = resultItem.result.candidates;
          if (candidates[0]?.content?.parts) {
            resultText = candidates[0].content.parts[0].text || '';
          }
        }
        
        // If we still don't have text, try to stringify the entire object
        if (!resultText && typeof resultItem.result === 'object') {
          resultText = JSON.stringify(resultItem.result, null, 2);
        }
        
        console.log(`Result text length: ${resultText.length} chars`);
        
        // Extract sections from the Gemini analysis
        const themesSection = extractSection(resultText, "THEMES & TOPICS");
        console.log(`Extracted themes section length: ${themesSection.length} chars`);
        
        const semanticSection = extractSection(resultText, "SEMANTIC ANALYSIS");
        console.log(`Extracted semantic section length: ${semanticSection.length} chars`);
        
        // Process themes
        const themeLines = themesSection.split('\n').filter(line => {
          const trimmedLine = line.trim();
          // Accept lines that start with bullet points, dashes, or contain common theme indicators
          return trimmedLine.startsWith('-') || 
                 trimmedLine.startsWith('•') || 
                 trimmedLine.startsWith('*') ||
                 /^[\d\.]+\s/.test(trimmedLine) || // Numbered items
                 /theme|topic|about|hashtag/i.test(trimmedLine);
        });
        console.log(`Found ${themeLines.length} theme lines`);
        
        themeLines.forEach(line => {
          // Clean the line to get just the theme text
          const theme = line.replace(/^[-•*\d\.]+\s*/, '').trim();
          if (theme) {
            const current = themeMap.get(theme) || { count: 0, examples: [] };
            themeMap.set(theme, { 
              count: current.count + 1, 
              examples: [...current.examples, resultItem.videoId].slice(0, 3)
            });
          }
        });
        
        // Extract keywords using multiple approaches
        const extractKeywords = (text: string): string[] => {
          if (!text) return [];
          
          const extractedKeywords: string[] = [];
          
          // Pattern to match likely keywords (capitalized words, phrases in quotes, hashtags)
          const patterns = [
            { regex: /#[\w]+/g, type: 'hashtag' },                    // Hashtags
            { regex: /"([^"]+)"/g, type: 'quoted' },                  // Quoted phrases
            { regex: /'([^']+)'/g, type: 'quoted-single' },           // Single-quoted phrases
            { regex: /\b[A-Z][a-zA-Z]+\b(?!\s*:)/g, type: 'capitalized' }, // Capitalized words
            { regex: /\b(?:theme|topic|trend)s?:?\s+([^,.;:]+)/gi, type: 'explicit' } // Explicit themes
          ];
          
          // Process each pattern
          patterns.forEach(({ regex, type }) => {
            const matches = text.match(regex);
            if (matches) {
              matches.forEach(match => {
                // Clean up the keyword
                let keyword;
                if (type === 'hashtag') {
                  keyword = match.substring(1); // Remove # from hashtag
                } else if (type === 'quoted' || type === 'quoted-single') {
                  keyword = match.replace(/^["']|["']$/g, ''); // Remove quotes
                } else if (type === 'explicit') {
                  // Extract the part after "theme:", "topic:", etc.
                  const parts = /\b(?:theme|topic|trend)s?:?\s+([^,.;:]+)/i.exec(match);
                  keyword = parts && parts[1] ? parts[1].trim() : match;
                } else {
                  keyword = match;
                }
                
                // Sanitize and validate the keyword
                keyword = keyword.trim();
                if (keyword.length > 2 && !/^(and|the|for|with|from|that|this|these|those|have|will|what)$/i.test(keyword)) {
                  extractedKeywords.push(keyword);
                  keywordSet.add(keyword);
                }
              });
            }
          });
          
          // Also look for any dance-related terms which are common in TikTok
          const danceKeywords = /dance|choreography|routine|moves|challenge/gi;
          let danceMatch;
          while ((danceMatch = danceKeywords.exec(text)) !== null) {
            const keyword = danceMatch[0];
            extractedKeywords.push(keyword);
            keywordSet.add(keyword);
          }
          
          return extractedKeywords;
        };
        
        const themeKeywords = extractKeywords(themesSection);
        console.log(`Extracted ${themeKeywords.length} theme keywords`);
        
        const semanticKeywords = extractKeywords(semanticSection);
        console.log(`Extracted ${semanticKeywords.length} semantic keywords`);
        
        const allKeywords = [...themeKeywords, ...semanticKeywords];
        
        // Build semantic relations between keywords that appear together
        allKeywords.forEach(sourceKeyword => {
          if (!relationMap.has(sourceKeyword)) {
            relationMap.set(sourceKeyword, new Map<string, number>());
          }
          
          allKeywords.forEach(targetKeyword => {
            if (sourceKeyword !== targetKeyword) {
              const relations = relationMap.get(sourceKeyword)!;
              relations.set(targetKeyword, (relations.get(targetKeyword) || 0) + 1);
            }
          });
        });
      } catch (err) {
        console.error(`Error processing result at index ${index}:`, err);
      }
    });
    
    // Convert maps to arrays
    try {
      const themesArray = Array.from(themeMap.entries())
        .map(([category, { count, examples }]) => ({ category, count, examples }))
        .sort((a, b) => b.count - a.count);
      
      // Build semantic relations array
      const relationsArray: KeywordRelation[] = [];
      relationMap.forEach((targets, source) => {
        targets.forEach((weight, target) => {
          if (weight > 1) { // Only include strong relationships
            relationsArray.push({ source, target, weight });
          }
        });
      });
      
      // Sort relations by weight
      relationsArray.sort((a, b) => b.weight - a.weight);
      
      console.log(`Generated ${themesArray.length} themes`);
      console.log(`Found ${keywordSet.size} unique keywords`);
      console.log(`Generated ${relationsArray.length} semantic relations`);
      
      setThemes(themesArray);
      setKeywords(Array.from(keywordSet));
      setSemanticRelations(relationsArray.slice(0, 20)); // Limit to top 20 relations
    } catch (err) {
      console.error("Error converting data structures:", err);
      setError("Error processing semantic data");
    }
    
    setProcessing(false);
    
    // Notify parent component that processing is complete
    if (onProcessingComplete) {
      onProcessingComplete();
    }
  };

  if (isLoading || processing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-red-600 dark:text-red-400">
          Error: {error}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please try again or check the console for more details.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No analysis results available. Process videos first to see the semantic dashboard.
        </p>
      </div>
    );
  }

  if (themes.length === 0 && keywords.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No semantic patterns were extracted from the analysis. The videos may not contain enough semantic content or the analysis format isn't compatible.
        </p>
        
        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Results found: {results.length}
          </p>
          <button
            onClick={() => {
              console.log("Manual processing of results:", results);
              setProcessing(true);
              setTimeout(() => {
                processGeminiResults();
              }, 100);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Process Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-5 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Semantic Analysis Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Visualizing relationships and patterns from {results.length} analyzed videos
        </p>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Top Themes and Topics */}
        {themes.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Top Themes and Topics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {themes.slice(0, 9).map((theme, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {theme.category}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {theme.count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Found in: {theme.examples.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Keyword Tags */}
        {keywords.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Key Terms
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 20).map((keyword, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-sm dark:bg-indigo-900 dark:text-indigo-200 shadow-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Semantic Relations */}
        {semanticRelations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Semantic Word Relationships
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Source Term
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Related Term
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Relationship Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {semanticRelations.map((relation, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {relation.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {relation.target}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className="bg-indigo-500 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, relation.weight * 20)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 