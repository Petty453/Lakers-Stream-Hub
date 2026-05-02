import { useState } from "react";
import { useGetLakersRoster } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShirtIcon } from "lucide-react";
import type { Player } from "@workspace/api-client-react";

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
      <span className="text-lg font-black text-primary tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function PlayerCard({ player, onClick }: { player: Player; onClick: () => void }) {
  return (
    <button
      className="w-full text-left"
      onClick={onClick}
      data-testid={`card-player-${player.id}`}
    >
      <Card className="border-border bg-card/80 hover:border-primary/40 hover:bg-card transition-all duration-200 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={player.photoUrl}
                alt={player.name}
                className="h-16 w-16 rounded-xl object-cover bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://a.espncdn.com/i/teamlogos/nba/500/lal.png";
                }}
              />
              <span className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground text-xs font-black px-1.5 py-0.5 rounded-md">
                {player.number}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{player.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs px-2 py-0 border-primary/30 text-primary">
                  {player.position}
                </Badge>
                {player.status === "Injured" && (
                  <Badge variant="destructive" className="text-xs px-2 py-0">
                    INJ
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { label: "PPG", value: player.stats.ppg.toFixed(1) },
                  { label: "RPG", value: player.stats.rpg.toFixed(1) },
                  { label: "APG", value: player.stats.apg.toFixed(1) },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs font-bold text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-black text-primary">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{player.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={player.photoUrl}
              alt={player.name}
              className="h-24 w-24 rounded-xl object-cover bg-muted"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://a.espncdn.com/i/teamlogos/nba/500/lal.png"; }}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShirtIcon className="h-4 w-4 text-primary" />
                <span className="text-lg font-black text-primary">#{player.number}</span>
                <Badge variant="outline" className="border-primary/30 text-primary">{player.position}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{player.height} · {player.weight}</p>
              {player.age && <p className="text-sm text-muted-foreground">Age: {player.age}</p>}
              {player.college && <p className="text-sm text-muted-foreground">College: {player.college}</p>}
              <p className="text-sm text-muted-foreground">Experience: {player.experience}</p>
              {player.status === "Injured" && player.injuryNote && (
                <Badge variant="destructive" className="text-xs">{player.injuryNote}</Badge>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Season Stats</p>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="PPG" value={player.stats.ppg.toFixed(1)} />
              <StatPill label="RPG" value={player.stats.rpg.toFixed(1)} />
              <StatPill label="APG" value={player.stats.apg.toFixed(1)} />
              <StatPill label="SPG" value={player.stats.spg.toFixed(1)} />
              <StatPill label="BPG" value={player.stats.bpg.toFixed(1)} />
              <StatPill label="MPG" value={player.stats.minutesPerGame.toFixed(1)} />
              <StatPill label="FG%" value={(player.stats.fgPct * 100).toFixed(1) + "%"} />
              <StatPill label="3P%" value={(player.stats.fg3Pct * 100).toFixed(1) + "%"} />
              <StatPill label="FT%" value={(player.stats.ftPct * 100).toFixed(1) + "%"} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RosterPage() {
  const { data, isLoading } = useGetLakersRoster();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);

  const players = (data?.players ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase()) ||
    p.number.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lakers Roster</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.teamRecord} · {data.teamRank}
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border"
            data-testid="input-search-player"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No players found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} onClick={() => setSelected(player)} />
          ))}
        </div>
      )}

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
