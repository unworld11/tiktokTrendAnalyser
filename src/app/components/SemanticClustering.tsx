import { useState, useEffect } from 'react';

type Video = {
  id?: string;
  aweme_id?: string;
  transcriptData?: {
    transcript: string;
    keywords: string[];
  };
};

type SemanticClusteringProps = {
  videos: Video[];
  selectedCluster?: string | null;
  onSelectCluster?: (clusterId: string) => void;
};

type ClusterNode = {
  id: string;
  label: string;
  size: number;
  group: number;
  videos: Video[];
};

type Connection = {
  source: string;
  target: string;
  strength: number;
};

export default function SemanticClustering({ 
  videos, 
  selectedCluster, 
  onSelectCluster 
}: SemanticClusteringProps) {
  const [clusters, setClusters] = useState<ClusterNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videos.length === 0) return;
    
    setLoading(true);
    
    // Simulate clustering API call
    setTimeout(() => {
      // Generate sample cluster data based on the videos
      const sampleClusters: ClusterNode[] = [
        {
          id: 'cluster-side-effects',
          label: 'Side Effects',
          size: Math.floor(videos.length * 0.4),
          group: 1,
          videos: videos.slice(0, Math.floor(videos.length * 0.4))
        },
        {
          id: 'cluster-nutrition',
          label: 'Nutrition',
          size: Math.floor(videos.length * 0.25),
          group: 2,
          videos: videos.slice(Math.floor(videos.length * 0.4), Math.floor(videos.length * 0.65))
        },
        {
          id: 'cluster-mental',
          label: 'Mental Effects',
          size: Math.floor(videos.length * 0.2),
          group: 3,
          videos: videos.slice(Math.floor(videos.length * 0.65), Math.floor(videos.length * 0.85))
        },
        {
          id: 'cluster-misc',
          label: 'Miscellaneous',
          size: Math.floor(videos.length * 0.15),
          group: 4,
          videos: videos.slice(Math.floor(videos.length * 0.85))
        }
      ];
      
      // Generate sample connections between clusters
      const sampleConnections: Connection[] = [
        { source: 'cluster-side-effects', target: 'cluster-nutrition', strength: 0.7 },
        { source: 'cluster-side-effects', target: 'cluster-mental', strength: 0.5 },
        { source: 'cluster-nutrition', target: 'cluster-mental', strength: 0.3 },
        { source: 'cluster-misc', target: 'cluster-side-effects', strength: 0.2 },
      ];
      
      setClusters(sampleClusters);
      setConnections(sampleConnections);
      setLoading(false);
    }, 1000);
  }, [videos]);

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
    <div className="w-full border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Semantic Clustering</h3>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Videos are semantically clustered based on content, transcripts, and on-screen text.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visualization (simplified) */}
              <div className="border rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm min-h-64 flex items-center justify-center">
                <div className="w-full aspect-square relative">
                  {/* This is a simple visualization; in a real implementation, you'd use a
                      library like D3.js, react-force-graph, or visx for proper graph visualization */}
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
                          const keywords = [
                            'ozempic', 'side effects', 'weight loss', 'medication',
                            'nutrition', 'supplements', 'deficiency', 'vitamins',
                            'brain fog', 'anxiety', 'mood', 'depression',
                            'dosage', 'health', 'doctor', 'treatment'
                          ];
                          
                          // Select keywords based on cluster group
                          let clusterKeywords: string[] = [];
                          if (selectedClusterData) {
                            if (selectedClusterData.group === 1) {
                              clusterKeywords = keywords.slice(0, 4);
                            } else if (selectedClusterData.group === 2) {
                              clusterKeywords = keywords.slice(4, 8);
                            } else if (selectedClusterData.group === 3) {
                              clusterKeywords = keywords.slice(8, 12);
                            } else {
                              clusterKeywords = keywords.slice(12, 16);
                            }
                          }
                          
                          return clusterKeywords.map((keyword, idx) => (
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
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {clusters.find(c => c.id === selectedCluster)?.size || 0} videos in this cluster
                      </p>
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
          </div>
        )}
      </div>
    </div>
  );
} 