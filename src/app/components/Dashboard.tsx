import { useState, useEffect } from 'react';

type Video = {
  id?: string;
  aweme_id?: string;
  transcriptData?: {
    transcript: string;
    keywords: string[];
  };
};

type DashboardProps = {
  videos: Video[];
};

type WordUsageStats = {
  word: string;
  count: number;
  videos: number;
};

type SemanticCluster = {
  name: string;
  keywords: string[];
  videoCount: number;
  topVideos: string[];
};

export default function Dashboard({ videos }: DashboardProps) {
  const [wordUsageStats, setWordUsageStats] = useState<WordUsageStats[]>([]);
  const [semanticClusters, setSemanticClusters] = useState<SemanticCluster[]>([]);
  const [healthRelatedTerms, setHealthRelatedTerms] = useState<WordUsageStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [transcribedVideos, setTranscribedVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (videos.length === 0) return;

    // Fetch transcript data for all videos that have been processed
    const fetchTranscriptData = async () => {
      setLoading(true);
      
      try {
        const transcriptPromises = videos.map(async (video) => {
          try {
            const response = await fetch(`/api/get-transcript?videoId=${video.id || video.aweme_id}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.transcription) {
                return {
                  ...video,
                  transcriptData: data.transcription
                };
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching transcript for video ${video.id}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(transcriptPromises);
        const validTranscripts = results.filter(result => result !== null);
        setTranscribedVideos(validTranscripts);
        
        // Process the transcript data to generate stats
        processTranscriptData(validTranscripts);
      } catch (error) {
        console.error('Error fetching transcript data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTranscriptData();
  }, [videos]);
  
  const processTranscriptData = (transcribedVideos: Video[]) => {
    if (transcribedVideos.length === 0) return;
    
    // Extract words and their usage from transcripts
    const wordUsage: Record<string, { count: number, videos: Set<string> }> = {};
    const healthTerms: Set<string> = new Set();
    const clusterKeywords: Record<string, Set<string>> = {
      'Medication & Treatment': new Set(['medicine', 'treatment', 'doctor', 'pill', 'medication', 'drug']),
      'Side Effects': new Set(['effects', 'side', 'nausea', 'headache', 'pain']),
      'Nutrition & Health': new Set(['nutrition', 'diet', 'food', 'healthy', 'vitamin']),
      'Symptoms': new Set(['symptom', 'fatigue', 'tired', 'energy', 'feeling'])
    };
    
    const clusterInstances: Record<string, { 
      keywords: Set<string>, 
      videoCount: number, 
      topVideos: Set<string> 
    }> = {};
    
    // Initialize cluster instances
    Object.keys(clusterKeywords).forEach(name => {
      clusterInstances[name] = {
        keywords: new Set(),
        videoCount: 0,
        topVideos: new Set()
      };
    });
    
    // Process each video with transcript data
    transcribedVideos.forEach(video => {
      if (!video.transcriptData) return;
      
      const { transcript, keywords } = video.transcriptData;
      const videoId = video.id || video.aweme_id;
      const processedWords = new Set<string>();
      
      // Process extracted keywords
      if (keywords && keywords.length > 0) {
        keywords.forEach((keyword: string) => {
          // Add to word usage stats
          if (!wordUsage[keyword]) {
            wordUsage[keyword] = { count: 0, videos: new Set() };
          }
          wordUsage[keyword].count += 1;
          if (videoId) {
            wordUsage[keyword].videos.add(videoId);
          }
          
          // Check if it belongs to any cluster
          Object.entries(clusterKeywords).forEach(([clusterName, keywords]) => {
            const belongsToCluster = Array.from(keywords).some(k => 
              keyword.toLowerCase().includes(k.toLowerCase())
            );
            
            if (belongsToCluster) {
              clusterInstances[clusterName].keywords.add(keyword);
              clusterInstances[clusterName].videoCount += 1;
              if (videoId) {
                clusterInstances[clusterName].topVideos.add(videoId);
              }
            }
          });
          
          // Check if it's a health-related term
          const isHealthTerm = /health|symptom|effect|pain|weight|diet|nutrition|fatigue|medicine|treatment/i.test(keyword);
          if (isHealthTerm) {
            healthTerms.add(keyword);
          }
        });
      }
      
      // Process full transcript text for additional insights
      if (transcript) {
        const words = transcript.toLowerCase().split(/\s+/);
        const wordCounts: Record<string, number> = {};
        
        // Count word frequencies
        words.forEach((word: string) => {
          // Skip short words and common stopwords
          if (word.length < 3 || /^(the|and|is|in|to|a|an|of|for|with|on|at)$/i.test(word)) {
            return;
          }
          
          if (!wordCounts[word]) {
            wordCounts[word] = 0;
          }
          wordCounts[word] += 1;
        });
        
        // Add significant words to usage stats (words that appear multiple times)
        Object.entries(wordCounts).forEach(([word, count]) => {
          if (count >= 2 && !processedWords.has(word)) {
            processedWords.add(word);
            
            if (!wordUsage[word]) {
              wordUsage[word] = { count: 0, videos: new Set() };
            }
            wordUsage[word].count += count;
            if (videoId) {
              wordUsage[word].videos.add(videoId);
            }
          }
        });
      }
    });
    
    // Convert wordUsage to array and sort by count
    const wordStatsArray = Object.entries(wordUsage).map(([word, stats]) => ({
      word,
      count: stats.count,
      videos: stats.videos.size
    })).sort((a, b) => b.count - a.count);
    
    // Get health-related terms
    const healthTermsArray = wordStatsArray.filter(stat => 
      Array.from(healthTerms).some(term => stat.word.toLowerCase().includes(term.toLowerCase()))
    ).slice(0, 8);
    
    // Convert cluster instances to array
    const clustersArray = Object.entries(clusterInstances)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, data]) => data.videoCount > 0)
      .map(([name, data]) => ({
        name,
        keywords: Array.from(data.keywords).slice(0, 6),
        videoCount: data.videoCount,
        topVideos: Array.from(data.topVideos).slice(0, 5)
      }));
    
    setWordUsageStats(wordStatsArray.slice(0, 15));
    setHealthRelatedTerms(healthTermsArray);
    setSemanticClusters(clustersArray);
  };

  if (videos.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Search for TikTok videos to see semantic analysis
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">TikTok Semantic Analysis</h3>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : transcribedVideos.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <p>No transcription data available yet. Please transcribe videos first.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Videos</h4>
                <p className="text-3xl font-semibold text-gray-800 dark:text-white">{videos.length}</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transcribed Videos</h4>
                <p className="text-3xl font-semibold text-gray-800 dark:text-white">
                  {transcribedVideos.length}
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Unique Terms</h4>
                <p className="text-3xl font-semibold text-gray-800 dark:text-white">
                  {wordUsageStats.length}
                </p>
              </div>
            </div>
            
            {/* Health-Related Terms */}
            {healthRelatedTerms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Health-Related Terms</h4>
                <div className="space-y-3">
                  {healthRelatedTerms.map((term, idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">{term.word}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500"
                          style={{ width: `${(term.count / (healthRelatedTerms[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-32 text-right text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {term.count} mentions in {term.videos} videos
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Semantic Clusters */}
            {semanticClusters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Semantic Clusters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {semanticClusters.map((cluster, idx) => (
                    <div key={idx} className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <h5 className="font-medium text-gray-700 dark:text-gray-300">{cluster.name}</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {cluster.videoCount} videos in this cluster
                        </p>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Related Keywords</h6>
                          <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map((keyword, kidx) => (
                              <span 
                                key={kidx} 
                                className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs dark:bg-indigo-900 dark:text-indigo-200"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Word Usage Statistics */}
            {wordUsageStats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Common Words & Phrases</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Word/Phrase
                        </th>
                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mention Count
                        </th>
                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Videos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {wordUsageStats.map((stat, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {stat.word}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {stat.count}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {stat.videos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 