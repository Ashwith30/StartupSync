import { NewsItem } from '../components/NewsInsightsSection';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Interface for the cache object
interface NewsCache {
  timestamp: number;
  items: NewsItem[];
}

// In-memory cache
let newsCache: NewsCache | null = null;

/**
 * Fetches Indian business news from NewsAPI.org
 * 
 * @param forceRefresh Force refresh the cache
 * @returns Promise with array of news items
 */
export async function fetchIndianBusinessNews(forceRefresh = false): Promise<NewsItem[]> {
  // Check if we have cached news that's still valid
  if (
    !forceRefresh && 
    newsCache && 
    Date.now() - newsCache.timestamp < CACHE_DURATION
  ) {
    console.log('Using cached news data');
    return newsCache.items;
  }

  try {
    // NewsAPI.org API key - should be moved to environment variables in production
    const API_KEY = 'YOUR_NEWS_API_KEY'; // Replace with actual API key
    
    // Get current date and 7 days ago for the date range
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Format dates for the API
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    // Fetch news from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=(india OR indian) AND (business OR startup OR economy OR market)&` +
      `domains=economictimes.indiatimes.com,business-standard.com,livemint.com,financialexpress.com,moneycontrol.com&` +
      `from=${fromDate}&` +
      `to=${toDate}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `apiKey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`News API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the API response to our NewsItem format
    const newsItems: NewsItem[] = data.articles.map((article: any, index: number) => {
      // Determine category based on article content
      const title = article.title.toLowerCase();
      const description = article.description?.toLowerCase() || '';
      
      let category = 'trends'; // Default category
      
      if (title.includes('funding') || title.includes('investment') || title.includes('investor') || 
          description.includes('funding') || description.includes('investment')) {
        category = 'funding';
      } else if (title.includes('legal') || title.includes('regulation') || title.includes('compliance') || 
                description.includes('legal') || description.includes('regulation')) {
        category = 'legal';
      } else if (title.includes('marketing') || title.includes('customer') || title.includes('brand') || 
                description.includes('marketing') || description.includes('customer')) {
        category = 'marketing';
      } else if (title.includes('operations') || title.includes('process') || 
                description.includes('operations') || description.includes('process')) {
        category = 'operations';
      } else if (title.includes('product') || title.includes('launch') || title.includes('feature') || 
                description.includes('product') || description.includes('launch')) {
        category = 'product';
      }
      
      // Determine relevance based on source reputation and content
      let relevance = 'medium';
      const topSources = ['The Economic Times', 'Business Standard', 'Mint', 'Financial Express'];
      
      if (topSources.includes(article.source.name)) {
        relevance = 'high';
      }
      
      return {
        id: index + 1,
        title: article.title,
        description: article.description || 'No description available',
        source: article.source.name,
        date: new Date(article.publishedAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        category,
        relevance,
        url: article.url, // Add URL to original article
      };
    });
    
    // Update cache
    newsCache = {
      timestamp: Date.now(),
      items: newsItems
    };
    
    console.log(`Fetched ${newsItems.length} news items`);
    return newsItems;
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // If we have cached data, return it as fallback even if expired
    if (newsCache) {
      console.log('Using expired cache as fallback');
      return newsCache.items;
    }
    
    // If no cache available, return fallback static data
    return getFallbackNews();
  }
}

/**
 * Provides fallback news data when API fails
 */
function getFallbackNews(): NewsItem[] {
  const today = new Date();
  
  // Format date for display
  const formatDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(today.getDate() - daysAgo);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return [
    {
      id: 1,
      title: "India's Tech Startups See Growth in Funding Despite Global Slowdown",
      description:
        "Recent funding rounds show Indian tech startups continuing to attract investments, with Bengaluru and Delhi NCR leading the growth.",
      source: "Economic Times",
      date: formatDate(0), // Today
      category: "funding",
      relevance: "high",
      url: "https://economictimes.indiatimes.com"
    },
    {
      id: 2,
      title: "SEBI Updates Regulations for Startup Fundraising",
      description:
        "Securities and Exchange Board of India introduces new guidelines to streamline processes for raising capital, benefiting early-stage companies.",
      source: "Business Standard",
      date: formatDate(1), // Yesterday
      category: "legal",
      relevance: "high",
      url: "https://business-standard.com"
    },
    // Add more fallback news items as needed
  ];
}
