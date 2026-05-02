import { useGetNbaStandings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StandingsPage() {
  const { data, isLoading } = useGetNbaStandings();
  const standings = data?.standings ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">NBA Standings</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.conference ?? "Western Conference"}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <Card className="border-border bg-card/80 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {data?.conference ?? "Western Conference"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5">Team</div>
              <div className="col-span-1 text-center">W</div>
              <div className="col-span-1 text-center">L</div>
              <div className="col-span-2 text-center">PCT</div>
              <div className="col-span-2 text-center">GB</div>
            </div>

            {standings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No standings data available</div>
            ) : (
              standings.map((entry, index) => {
                const isPlayoffLine = index === 5;
                const isPlayInLine = index === 9;
                return (
                  <div key={entry.teamAbbr}>
                    {isPlayoffLine && (
                      <div className="h-px bg-green-500/30 mx-4 my-1 relative">
                        <span className="absolute -top-2.5 right-0 text-xs text-green-500/60 pr-1">Playoffs</span>
                      </div>
                    )}
                    {isPlayInLine && (
                      <div className="h-px bg-yellow-500/30 mx-4 my-1 relative">
                        <span className="absolute -top-2.5 right-0 text-xs text-yellow-500/60 pr-1">Play-In</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors",
                        entry.isLakers
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-muted/20"
                      )}
                      data-testid={`standing-row-${entry.teamAbbr}`}
                    >
                      <div className="col-span-1 text-center">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            entry.isLakers ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {entry.rank}
                        </span>
                      </div>
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <img
                          src={entry.logo}
                          alt={entry.teamAbbr}
                          className="h-6 w-6 object-contain flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-sm font-semibold truncate",
                              entry.isLakers ? "text-primary" : "text-foreground"
                            )}
                          >
                            <span className="hidden sm:inline">{entry.teamName}</span>
                            <span className="sm:hidden">{entry.teamAbbr}</span>
                          </p>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={cn("text-sm font-bold", entry.isLakers ? "text-primary" : "text-foreground")}>
                          {entry.wins}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm text-muted-foreground">{entry.losses}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={cn("text-sm tabular-nums", entry.isLakers ? "text-primary font-semibold" : "text-muted-foreground")}>
                          {entry.winPct.toFixed(3).replace("0.", ".")}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-muted-foreground tabular-nums">{entry.gamesBehind}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
