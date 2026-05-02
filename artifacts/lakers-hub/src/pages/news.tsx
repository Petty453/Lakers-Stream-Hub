import { useGetLakersNews } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Clock } from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NewsPage() {
  const { data, isLoading } = useGetLakersNews();
  const articles = data?.articles ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lakers News</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest news and updates from ESPN</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No news available</div>
      ) : (
        <div className="space-y-4">
          {/* Featured article */}
          {articles.length > 0 && articles[0].imageUrl && (
            <a
              href={articles[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              data-testid={`article-featured-${articles[0].id}`}
            >
              <Card className="border-border bg-card/80 hover:border-primary/30 transition-all overflow-hidden">
                <div className="grid sm:grid-cols-5 gap-0">
                  <div className="sm:col-span-2">
                    <img
                      src={articles[0].imageUrl}
                      alt={articles[0].headline}
                      className="w-full h-48 sm:h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <CardContent className="p-5 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs px-2 border-primary/30 text-primary">
                            Featured
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 border-border text-muted-foreground">
                            {articles[0].category}
                          </Badge>
                        </div>
                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {articles[0].headline}
                        </h2>
                        {articles[0].description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {articles[0].description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {articles[0].source} · {timeAgo(articles[0].publishedAt)}
                        </span>
                        <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </a>
          )}

          {/* Other articles */}
          {articles.slice(1).map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              data-testid={`article-card-${article.id}`}
            >
              <Card className="border-border bg-card/80 hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt={article.headline}
                        className="h-20 w-28 rounded-lg object-cover flex-shrink-0 bg-muted"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-border text-muted-foreground">
                          {article.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">
                        {article.headline}
                      </h3>
                      {article.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.source} · {timeAgo(article.publishedAt)}
                        </span>
                        <ExternalLink className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
