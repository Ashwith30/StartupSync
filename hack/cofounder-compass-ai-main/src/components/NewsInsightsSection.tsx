
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Bookmark, Clock, Newspaper, TrendingUp, BadgeIndianRupee, ChartBar, IndianRupee, Info, RefreshCw, ExternalLink } from "lucide-react";
import { fetchIndianBusinessNews } from "../utils/newsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const NewsInsightsSection = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch news data on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  // Function to fetch news data
  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchIndianBusinessNews(forceRefresh);
      setNewsItems(data);
      setLastUpdated(new Date());

      if (forceRefresh) {
        toast({
          title: "News Updated",
          description: "Latest Indian business insights have been loaded.",
        });
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error Loading News",
        description: "Could not load the latest news. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchNews(true);
  };

  // Filter news based on active tab
  const filteredNews = activeTab === "all"
    ? newsItems
    : newsItems.filter(item => item.category === activeTab);

  // Handle scroll to section when clicking "View More Insights"
  const handleViewMoreClick = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log("Features section not found");
    }
  };

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return lastUpdated.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section id="insights" className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Indian Business Insights & News</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay informed with relevant news and analysis for your Indian business domain.
          </p>
          <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
            {lastUpdated && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Last updated: {formatLastUpdated()}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-7 px-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8 overflow-x-auto">
            <TabsList className="flex-wrap justify-center">
              <TabsTrigger value="all">All Insights</TabsTrigger>
              <TabsTrigger value="funding">Funding</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <Skeleton className="h-6 w-full mb-1" />
                      <Skeleton className="h-6 w-4/5" />
                    </CardHeader>
                    <CardContent className="pb-2 flex-grow">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No news found in this category. Try another category or refresh.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh News
                </Button>
              </div>
            )}

            <div className="text-center mt-12">
              <Button variant="outline" className="gap-2" onClick={handleViewMoreClick}>
                View More Indian Insights <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  source: string;
  date: string;
  category: string;
  relevance: string;
  url?: string; // URL to the original article
}

const NewsCard = ({ item }: { item: NewsItem }) => {
  const [isSaved, setIsSaved] = useState(false);

  // Format date to show "Today" or "Yesterday" for recent dates
  const formatDate = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toLocaleDateString('en-IN');
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');
    const itemDate = new Date(dateStr);
    const itemDateStr = itemDate.toLocaleDateString('en-IN');

    if (itemDateStr === todayStr) {
      return "Today";
    } else if (itemDateStr === yesterdayStr) {
      return "Yesterday";
    }

    return dateStr;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "funding":
        return "bg-fundraising text-white";
      case "legal":
        return "bg-legal text-white";
      case "marketing":
        return "bg-marketing text-white";
      case "operations":
        return "bg-operations text-white";
      case "product":
        return "bg-product text-white";
      case "trends":
        return "bg-secondary text-white";
      default:
        return "bg-primary text-white";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "funding":
        return <BadgeIndianRupee className="h-3 w-3 mr-1" />;
      case "legal":
        return <Info className="h-3 w-3 mr-1" />;
      case "marketing":
        return <ChartBar className="h-3 w-3 mr-1" />;
      case "operations":
        return <IndianRupee className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  // Open the original article in a new tab
  const openOriginalArticle = () => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={`${getCategoryColor(item.category)} mb-2 flex items-center`}>
            {getCategoryIcon(item.category)}
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Badge>
          {item.relevance === "high" && (
            <Badge variant="outline" className="border-primary text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> High Relevance
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">
          {item.title}
          {item.url && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 p-0 h-auto inline-flex align-middle"
              onClick={openOriginalArticle}
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <CardDescription>{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Newspaper className="h-3 w-3" />
          <span>{item.source}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDate(item.date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className={`p-1 h-8 w-8 ${isSaved ? 'text-primary' : ''}`}
            onClick={() => setIsSaved(!isSaved)}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          {item.url && (
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-8 w-8"
              onClick={openOriginalArticle}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default NewsInsightsSection;
