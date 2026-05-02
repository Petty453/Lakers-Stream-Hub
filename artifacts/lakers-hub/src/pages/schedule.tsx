import { useState } from "react";
import { useGetLakersSchedule } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Download, MapPin, Clock, CheckCircle2, Circle } from "lucide-react";

function makeGoogleCalendarUrl(game: {
  date: string;
  time: string;
  opponent: string;
  lakersIsHome: boolean;
  venue: string;
}) {
  const title = game.lakersIsHome
    ? `Lakers vs ${game.opponent}`
    : `Lakers @ ${game.opponent}`;
  const details = `${game.lakersIsHome ? "Home" : "Away"} game at ${game.venue}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(game.venue)}`;
}

function makeIcsContent(game: {
  date: string;
  time: string;
  opponent: string;
  lakersIsHome: boolean;
  venue: string;
  id: string;
}) {
  const title = game.lakersIsHome ? `Lakers vs ${game.opponent}` : `Lakers @ ${game.opponent}`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lakers Hub//EN",
    "BEGIN:VEVENT",
    `UID:${game.id}@lakersgame`,
    `DTSTAMP:${now}`,
    `SUMMARY:${title}`,
    `LOCATION:${game.venue}`,
    "DURATION:PT2H30M",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(game: {
  date: string;
  time: string;
  opponent: string;
  lakersIsHome: boolean;
  venue: string;
  id: string;
}) {
  const content = makeIcsContent(game);
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lakers-vs-${game.opponent.toLowerCase().replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SchedulePage() {
  const { data, isLoading } = useGetLakersSchedule();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const games = data?.games ?? [];
  const filtered = games.filter((g) => {
    if (filter === "upcoming") return g.status === "Scheduled" || g.status === "In Progress";
    if (filter === "past") return g.result !== null && g.result !== undefined;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Season Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.season ?? "2025-26 Season"}</p>
        </div>
        <div className="flex gap-2">
          {(["all", "upcoming", "past"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}
              data-testid={`button-filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No games found</div>
          )}
          {filtered.map((game) => {
            const isWin = game.result?.startsWith("W");
            const isLoss = game.result?.startsWith("L");
            const isScheduled = !game.result;
            return (
              <Card
                key={game.id}
                className="border-border bg-card/80 hover:border-primary/30 transition-colors"
                data-testid={`game-card-${game.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Result badge */}
                    <div className="w-8 flex-shrink-0 flex items-center justify-center">
                      {isWin && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                      {isLoss && <Circle className="h-6 w-6 text-red-500" />}
                      {isScheduled && <Circle className="h-6 w-6 text-muted-foreground/40" />}
                    </div>

                    {/* Opponent logo */}
                    <img
                      src={game.opponentLogo}
                      alt={game.opponent}
                      className="h-10 w-10 object-contain flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />

                    {/* Game info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">
                          {game.lakersIsHome ? "vs" : "@"} {game.opponent}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0 ${
                            game.lakersIsHome
                              ? "border-primary/40 text-primary"
                              : "border-secondary/40 text-secondary-foreground bg-secondary/20"
                          }`}
                        >
                          {game.lakersIsHome ? "Home" : "Away"}
                        </Badge>
                        {game.status === "In Progress" && (
                          <Badge className="bg-red-600 text-white text-xs animate-pulse">LIVE</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{game.date} · {game.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{game.venue}</span>
                      </div>
                    </div>

                    {/* Score or actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {game.result ? (
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold ${
                              isWin ? "text-green-500" : "text-red-500"
                            }`}
                            data-testid={`text-result-${game.id}`}
                          >
                            {game.result}
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(makeGoogleCalendarUrl(game), "_blank")}
                            title="Add to Google Calendar"
                            data-testid={`button-gcal-${game.id}`}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-primary"
                            onClick={() => downloadIcs(game)}
                            title="Download .ics"
                            data-testid={`button-ics-${game.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
