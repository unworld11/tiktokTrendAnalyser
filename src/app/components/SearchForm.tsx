import { useState } from 'react';

type SearchType = 'SEARCH' | 'TREND' | 'HASHTAG' | 'USER' | 'MUSIC';
type PublishTime = 'ALL_TIME' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'THREE_MONTH' | 'SIX_MONTH';

type SearchParams = {
  type: SearchType;
  region: string;
  url: string;
  keywords: string[];
  maxItems: number;
  isUnlimited: boolean;
  sortType: number;
  publishTime: PublishTime;
};

export default function SearchForm({ onSearch }: { onSearch: (searchParams: SearchParams) => void }) {
  const [searchType, setSearchType] = useState<SearchType>('SEARCH');
  const [region, setRegion] = useState('US');
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [maxItems, setMaxItems] = useState(20);
  const [sortType, setSortType] = useState(0);
  const [publishTime, setPublishTime] = useState<PublishTime>('ALL_TIME');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const searchParams = {
      type: searchType,
      region,
      url: url.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      maxItems,
      isUnlimited: false,
      sortType,
      publishTime
    };
    
    try {
      onSearch(searchParams);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-5 text-gray-800 dark:text-white">TikTok Search Parameters</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Search Type
            </label>
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
            >
              <option value="SEARCH">Keyword Search</option>
              <option value="TREND">Trending</option>
              <option value="HASHTAG">Hashtag</option>
              <option value="USER">User Profile</option>
              <option value="MUSIC">Music</option>
            </select>
          </div>
          
          {(searchType === 'SEARCH' || searchType === 'TREND') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Region
              </label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="IN">India</option>
                <option value="BR">Brazil</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
          )}
          
          {(searchType === 'HASHTAG' || searchType === 'USER' || searchType === 'MUSIC') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                TikTok URL
              </label>
              <input 
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username or hashtag URL"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          )}
          
          {searchType === 'SEARCH' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Keywords (comma separated)
              </label>
              <input 
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="dance, trending, viral"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Max Items
            </label>
            <input 
              type="number"
              value={maxItems}
              min={1}
              max={100}
              onChange={(e) => setMaxItems(parseInt(e.target.value))}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
            />
          </div>
          
          {searchType === 'SEARCH' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Sort By
                </label>
                <select 
                  value={sortType}
                  onChange={(e) => setSortType(parseInt(e.target.value))}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                >
                  <option value={0}>Relevance</option>
                  <option value={1}>Most Liked</option>
                  <option value={2}>Most Recent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Publish Time
                </label>
                <select 
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value as PublishTime)}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                >
                  <option value="ALL_TIME">All Time</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="WEEK">Past Week</option>
                  <option value="MONTH">Past Month</option>
                  <option value="THREE_MONTH">Past 3 Months</option>
                  <option value="SIX_MONTH">Past 6 Months</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg text-sm flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isLoading ? 'Searching...' : 'Search TikTok'}
          </button>
        </div>
      </form>
    </div>
  );
} 