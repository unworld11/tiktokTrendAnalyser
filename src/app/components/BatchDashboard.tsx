import { useState, useEffect } from 'react';

type VideoResult = {
  videoUrl: string;
  videoId: string;
  result: any;
  error?: string;
};

type BatchDashboardProps = {
  results: VideoResult[];
};

type InsightItem = {
  category: string;
  count: number;
  examples: string[];
};

export default function BatchDashboard({ results }: BatchDashboardProps) {
  const [themes, setThemes] = useState<InsightItem[]>([]);
  const [audiences, setAudiences] = useState<InsightItem[]>([]);
  const [engagementFactors, setEngagementFactors] = useState<InsightItem[]>([]);
  const [semanticPatterns, setSemanticPatterns] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (results.length > 0) {
      analyzeResults();
    }
  }, [results]);

  const extractSection = (text: string, sectionName: string): string => {
    const sectionRegex = new RegExp(`${sectionName}[:\\s\\n]+(.*?)(?:\\d+\\.|$)`, 'is');
    const match = text.match(sectionRegex);
    return match ? match[1].trim() : '';
  };

  const analyzeResults = () => {
    setLoading(true);
    
    // Process each result to extract insights
    const themeMap = new Map<string, { count: number; examples: string[] }>();
    const audienceMap = new Map<string, { count: number; examples: string[] }>();
    const engagementMap = new Map<string, { count: number; examples: string[] }>();
    const semanticMap = new Map<string, { count: number; examples: string[] }>();
    
    results.forEach(result => {
      if (result.error || !result.result) return;
      
      // Extract the text content
      let content = '';
      if (result.result.candidates && result.result.candidates.length > 0) {
        for (const candidate of result.result.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                content += part.text;
              }
            }
          }
        }
      } else if (result.result.text) {
        content = result.result.text;
      }
      
      if (!content) return;
      
      // Extract sections
      const themesSection = extractSection(content, '4\\. THEMES & TOPICS');
      const audienceSection = extractSection(content, '6\\. AUDIENCE & CONTEXT');
      const engagementSection = extractSection(content, '5\\. ENGAGEMENT FACTORS');
      const semanticSection = extractSection(content, '7\\. SEMANTIC ANALYSIS');
      
      // Extract themes
      const themeLines = themesSection.split('\n').filter(line => line.trim().startsWith('-'));
      themeLines.forEach(line => {
        const theme = line.replace(/^-\s*/, '').trim();
        if (theme) {
          const current = themeMap.get(theme) || { count: 0, examples: [] };
          themeMap.set(theme, { 
            count: current.count + 1, 
            examples: [...current.examples, result.videoId].slice(0, 3)
          });
        }
      });
      
      // Extract audience insights
      const audienceLines = audienceSection.split('\n').filter(line => line.trim().startsWith('-'));
      audienceLines.forEach(line => {
        const audience = line.replace(/^-\s*/, '').trim();
        if (audience) {
          const current = audienceMap.get(audience) || { count: 0, examples: [] };
          audienceMap.set(audience, { 
            count: current.count + 1, 
            examples: [...current.examples, result.videoId].slice(0, 3)
          });
        }
      });
      
      // Extract engagement factors
      const engagementLines = engagementSection.split('\n').filter(line => line.trim().startsWith('-'));
      engagementLines.forEach(line => {
        const factor = line.replace(/^-\s*/, '').trim();
        if (factor) {
          const current = engagementMap.get(factor) || { count: 0, examples: [] };
          engagementMap.set(factor, { 
            count: current.count + 1, 
            examples: [...current.examples, result.videoId].slice(0, 3)
          });
        }
      });
      
      // Extract semantic patterns
      const semanticLines = semanticSection.split('\n').filter(line => line.trim().startsWith('-'));
      semanticLines.forEach(line => {
        const pattern = line.replace(/^-\s*/, '').trim();
        if (pattern) {
          const current = semanticMap.get(pattern) || { count: 0, examples: [] };
          semanticMap.set(pattern, { 
            count: current.count + 1, 
            examples: [...current.examples, result.videoId].slice(0, 3)
          });
        }
      });
    });
    
    // Convert maps to sorted arrays
    const themesArray = Array.from(themeMap.entries())
      .map(([category, { count, examples }]) => ({ category, count, examples }))
      .sort((a, b) => b.count - a.count);
    
    const audiencesArray = Array.from(audienceMap.entries())
      .map(([category, { count, examples }]) => ({ category, count, examples }))
      .sort((a, b) => b.count - a.count);
    
    const engagementArray = Array.from(engagementMap.entries())
      .map(([category, { count, examples }]) => ({ category, count, examples }))
      .sort((a, b) => b.count - a.count);
    
    const semanticArray = Array.from(semanticMap.entries())
      .map(([category, { count, examples }]) => ({ category, count, examples }))
      .sort((a, b) => b.count - a.count);
    
    setThemes(themesArray);
    setAudiences(audiencesArray);
    setEngagementFactors(engagementArray);
    setSemanticPatterns(semanticArray);
    setLoading(false);
  };

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No analysis results available. Process videos first to see the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aggregate Analysis Dashboard
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Themes Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Common Themes & Topics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.slice(0, 10).map((theme, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {theme.category}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {theme.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Found in: {theme.examples.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Audience Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Target Audiences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audiences.slice(0, 8).map((audience, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {audience.category}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {audience.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Found in: {audience.examples.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Engagement Factors */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Engagement Factors
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {engagementFactors.slice(0, 8).map((factor, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {factor.category}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {factor.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Found in: {factor.examples.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Semantic Patterns */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Semantic Patterns
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semanticPatterns.slice(0, 8).map((pattern, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {pattern.category}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                        {pattern.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Found in: {pattern.examples.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 