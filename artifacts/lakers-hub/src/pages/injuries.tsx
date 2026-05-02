import { useGetLakersInjuries } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2 } from "lucide-react";

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "out") return "bg-red-900/40 text-red-400 border-red-800/50";
  if (s === "questionable") return "bg-yellow-900/40 text-yellow-400 border-yellow-800/50";
  if (s === "probable") return "bg-green-900/40 text-green-400 border-green-800/50";
  if (s === "day-to-day") return "bg-orange-900/40 text-orange-400 border-orange-800/50";
  return "bg-muted text-muted-foreground border-border";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function InjuriesPage() {
  const { data, isLoading } = useGetLakersInjuries();
  const injuries = data?.injuries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Injury Report</h1>
          {data?.lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {timeAgo(data.lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            { label: "Out", color: "bg-red-500" },
            { label: "Questionable", color: "bg-yellow-500" },
            { label: "Probable", color: "bg-green-500" },
            { label: "Day-To-Day", color: "bg-orange-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : injuries.length === 0 ? (
        <Card className="border-border bg-card/80">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-foreground">All players available</p>
            <p className="text-sm text-muted-foreground mt-1">No reported injuries at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {injuries.map((entry) => (
            <Card
              key={entry.playerId}
              className="border-border bg-card/80 hover:border-primary/20 transition-colors"
              data-testid={`injury-card-${entry.playerId}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={entry.photoUrl}
                    alt={entry.playerName}
                    className="h-14 w-14 rounded-xl object-cover bg-muted flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://a.espncdn.com/i/teamlogos/nba/500/lal.png"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{entry.playerName}</span>
                      <span className="text-xs text-muted-foreground">#{entry.number}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary/30 text-primary">
                        {entry.position}
                      </Badge>
                    </div>
                    {entry.injuryType && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.injuryType}</p>
                    )}
                    {entry.returnDate && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expected return: {entry.returnDate}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 font-semibold text-xs border ${statusColor(entry.status)}`}
                      data-testid={`badge-status-${entry.playerId}`}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
