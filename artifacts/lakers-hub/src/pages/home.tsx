import { useState } from "react";
import { useGetLakersLive, getGetLakersLiveQueryKey, useGetLakersSchedule } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Volume2, VolumeX, Radio, Clock, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const [muted, setMuted] = useState(true);
  const { data: live, isLoading: liveLoading } = useGetLakersLive({
    query: { refetchInterval: 30000, queryKey: getGetLakersLiveQueryKey() },
  });
  const { data: schedule, isLoading: scheduleLoading } = useGetLakersSchedule();

  const nextGame = schedule?.games?.find(
    (g) => g.status === "Scheduled" || g.status === "Final" === false
  );
  const upcomingGames = schedule?.games?.filter((g) => g.status === "Scheduled").slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Game Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time scores, stream, and game updates</p>
        </div>
        {live?.isLive && (
          <Badge className="bg-red-600 text-white animate-pulse px-3 py-1 text-sm font-semibold">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        )}
      </div>

      {/* Score Card */}
      {liveLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : live?.isLive && live.game ? (
        <Card className="border-primary/30 bg-card/80 backdrop-blur overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Lakers Side */}
              <div className="flex flex-col items-center space-y-2 flex-1">
                <img
                  src="https://a.espncdn.com/i/teamlogos/nba/500/lal.png"
                  alt="Lakers"
                  className="h-16 w-16 object-contain"
                />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Lakers</span>
                <span className="text-5xl font-black text-primary tabular-nums">{live.game.lakersScore}</span>
              </div>

              {/* Middle */}
              <div className="flex flex-col items-center space-y-1 px-4">
                <Badge variant="outline" className="border-primary/40 text-primary text-xs px-2">
                  Q{live.game.period}
                </Badge>
                <span className="text-xl font-bold text-foreground">{live.game.clock}</span>
                <span className="text-xs text-muted-foreground">{live.game.status}</span>
              </div>

              {/* Opponent Side */}
              <div className="flex flex-col items-center space-y-2 flex-1">
                <img
                  src={live.game.opponentLogo}
                  alt={live.game.opponent}
                  className="h-16 w-16 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{live.game.opponent}</span>
                <span className="text-5xl font-black text-foreground tabular-nums">{live.game.opponentScore}</span>
              </div>
            </div>

            {/* Leaders */}
            {live.game.leaders && live.game.leaders.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Game Leaders</p>
                <div className="flex flex-wrap gap-4">
                  {live.game.leaders.map((leader, i) => {
                    const statValue = leader.points > 0
                      ? `${leader.points} PTS`
                      : leader.rebounds > 0
                      ? `${leader.rebounds} REB`
                      : `${leader.assists} AST`;
                    const catLabel = leader.points > 0 ? "Points" : leader.rebounds > 0 ? "Rebounds" : "Assists";
                    return (
                      <div key={`${leader.playerId}-${catLabel}`} className="flex items-center space-x-2">
                        <img
                          src={leader.photoUrl}
                          alt={leader.name}
                          className="h-9 w-9 rounded-full object-cover bg-muted border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png'; }}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">{catLabel}</p>
                          <p className="text-xs font-semibold text-foreground">{leader.name.split(" ").slice(-1)[0]}</p>
                          <p className="text-xs text-primary font-bold">{statValue}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card/80">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-4">
                <img src="https://a.espncdn.com/i/teamlogos/nba/500/lal.png" alt="Lakers" className="h-12 w-12 object-contain" />
              </div>
              <p className="text-muted-foreground text-sm">No live game right now</p>
              {upcomingGames && upcomingGames.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Next Up</p>
                  {upcomingGames.slice(0, 1).map((game) => (
                    <div key={game.id} className="flex items-center justify-center space-x-4 p-3 rounded-lg bg-muted/30">
                      <img src={game.opponentLogo} alt={game.opponent} className="h-8 w-8 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">vs {game.opponent}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{game.date} · {game.time}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{game.venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Stream */}
      <Card className="border-border bg-card/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500" />
              Live Stream
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Stream muted by default (Vietnamese audio). Toggle sound if desired.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMuted(!muted)}
            className="border-primary/40 text-primary hover:bg-primary/10"
            data-testid="button-toggle-sound"
          >
            {muted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
            {muted ? "Unmute" : "Mute"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-black rounded-b-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {live?.streamUrl ? (
              <iframe
                src={live.streamUrl}
                className="w-full h-full"
                style={{ minHeight: "360px" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Lakers Live Stream"
                data-testid="iframe-live-stream"
              />
            ) : (
              <div className="w-full flex items-center justify-center bg-black/80" style={{ aspectRatio: "16/9", minHeight: "360px" }}>
                <div className="text-center space-y-3 p-8">
                  <img src="https://a.espncdn.com/i/teamlogos/nba/500/lal.png" alt="Lakers" className="h-16 w-16 object-contain mx-auto opacity-30" />
                  <p className="text-muted-foreground text-sm">Stream available during live games</p>
                  <a
                    href="https://icmzaar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary text-sm hover:underline"
                  >
                    Open icmzaar.com <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Games */}
      {scheduleLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : upcomingGames && upcomingGames.length > 0 ? (
        <Card className="border-border bg-card/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">Upcoming Games</CardTitle>
            <Link href="/schedule" className="text-primary text-sm hover:underline flex items-center">
              Full Schedule <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors" data-testid={`game-upcoming-${game.id}`}>
                <div className="flex items-center space-x-3">
                  <img src={game.opponentLogo} alt={game.opponent} className="h-8 w-8 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{game.lakersIsHome ? "vs" : "@"} {game.opponent}</p>
                    <p className="text-xs text-muted-foreground">{game.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-primary">{game.time}</p>
                  <p className="text-xs text-muted-foreground">{game.lakersIsHome ? "Home" : "Away"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
