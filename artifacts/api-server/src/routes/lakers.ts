import { Router, type IRouter } from "express";
import {
  GetLakersScheduleResponse,
  GetLakersLiveResponse,
  GetLakersRosterResponse,
  GetLakersNewsResponse,
  GetLakersInjuriesResponse,
  GetNbaStandingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LAKERS_TEAM_ID = "13";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/basketball/nba";

async function espnFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LakersHub/1.0)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status} ${url}`);
  return res.json();
}

function getPlayerPhoto(playerId: string): string {
  return `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`;
}

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    }) + " PT"
  );
}

router.get("/lakers/schedule", async (req, res): Promise<void> => {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/teams/${LAKERS_TEAM_ID}/schedule?limit=100`
    )) as Record<string, unknown>;

    const events = ((data.events as unknown[]) ?? []) as Record<string, unknown>[];

    const games = events.map((ev) => {
      const comps = ((ev.competitions as unknown[]) ?? []) as Record<string, unknown>[];
      const comp = comps[0] ?? {};
      const competitors = ((comp.competitors as unknown[]) ?? []) as Record<string, unknown>[];
      const compStatus = (comp.status as Record<string, unknown>) ?? {};
      const compStatusType = (compStatus.type as Record<string, unknown>) ?? {};

      const home = competitors.find((c) => c.homeAway === "home") as Record<string, unknown> | undefined;
      const away = competitors.find((c) => c.homeAway === "away") as Record<string, unknown> | undefined;
      const homeTeam = (home?.team as Record<string, unknown>) ?? {};
      const awayTeam = (away?.team as Record<string, unknown>) ?? {};
      const lakersIsHome = homeTeam.id === LAKERS_TEAM_ID;
      const opponentTeam = lakersIsHome ? awayTeam : homeTeam;
      const lakersComp = lakersIsHome ? home : away;
      const oppComp = lakersIsHome ? away : home;

      const homeScoreVal = (home?.score as Record<string, unknown>)?.value as number | null ?? null;
      const awayScoreVal = (away?.score as Record<string, unknown>)?.value as number | null ?? null;
      const lakersScoreVal = lakersIsHome ? homeScoreVal : awayScoreVal;
      const oppScoreVal = lakersIsHome ? awayScoreVal : homeScoreVal;

      const isCompleted = compStatusType.completed === true;
      let result: string | null = null;
      if (isCompleted && lakersScoreVal !== null && oppScoreVal !== null) {
        const won = lakersComp?.winner === true;
        result = won
          ? `W ${lakersScoreVal}-${oppScoreVal}`
          : `L ${lakersScoreVal}-${oppScoreVal}`;
      }

      const opponentAbbr = ((opponentTeam.abbreviation as string) ?? "").toLowerCase();
      const dateStr = (ev.date as string) ?? "";

      return {
        id: (ev.id as string) ?? String(Math.random()),
        date: formatGameDate(dateStr),
        time: formatGameTime(dateStr),
        homeTeam: (homeTeam.displayName as string) ?? "TBD",
        awayTeam: (awayTeam.displayName as string) ?? "TBD",
        homeScore: homeScoreVal,
        awayScore: awayScoreVal,
        status: (compStatusType.description as string) ?? "Scheduled",
        venue:
          ((comp.venue as Record<string, unknown>)?.fullName as string) ??
          "Crypto.com Arena",
        isLakers: true,
        lakersIsHome,
        opponent: (opponentTeam.displayName as string) ?? "TBD",
        opponentLogo: opponentAbbr
          ? `https://a.espncdn.com/i/teamlogos/nba/500/${opponentAbbr}.png`
          : `https://a.espncdn.com/i/teamlogos/nba/500/${opponentTeam.id}.png`,
        result,
      };
    });

    const seasonDisplay =
      (data.season as Record<string, unknown>)?.displayName as string ??
      "2025-26";

    res.json(GetLakersScheduleResponse.parse({ games, season: seasonDisplay }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Lakers schedule");
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

router.get("/lakers/live", async (req, res): Promise<void> => {
  try {
    const scoreboard = (await espnFetch(
      `${ESPN_BASE}/scoreboard`
    )) as Record<string, unknown>;
    const events = ((scoreboard.events as unknown[]) ?? []) as Record<string, unknown>[];

    const lakersEvent = events.find((ev) => {
      const comps = ((ev.competitions as unknown[]) ?? []) as Record<string, unknown>[];
      const comp = comps[0] ?? {};
      const competitors = ((comp.competitors as unknown[]) ?? []) as Record<string, unknown>[];
      return competitors.some((c) => {
        const team = c.team as Record<string, unknown>;
        return team?.id === LAKERS_TEAM_ID;
      });
    }) as Record<string, unknown> | undefined;

    if (!lakersEvent) {
      res.json(
        GetLakersLiveResponse.parse({ isLive: false, game: null, streamUrl: null })
      );
      return;
    }

    const comps = ((lakersEvent.competitions as unknown[]) ?? []) as Record<string, unknown>[];
    const comp = comps[0] ?? {};
    const compStatus = (comp.status as Record<string, unknown>) ?? {};
    const compStatusType = (compStatus.type as Record<string, unknown>) ?? {};
    const isLive = compStatusType.state === "in" || compStatusType.state === "pre";

    const competitors = ((comp.competitors as unknown[]) ?? []) as Record<string, unknown>[];
    const home = competitors.find((c) => c.homeAway === "home") as Record<string, unknown> | undefined;
    const away = competitors.find((c) => c.homeAway === "away") as Record<string, unknown> | undefined;
    const homeTeam = (home?.team as Record<string, unknown>) ?? {};
    const awayTeam = (away?.team as Record<string, unknown>) ?? {};
    const lakersIsHome = homeTeam.id === LAKERS_TEAM_ID;
    const opponentTeam = lakersIsHome ? awayTeam : homeTeam;
    const lakersComp = lakersIsHome ? home : away;
    const oppComp = lakersIsHome ? away : home;
    const opponentAbbr = ((opponentTeam.abbreviation as string) ?? "").toLowerCase();

    const lakersScore =
      ((lakersComp?.score as Record<string, unknown>)?.value as number) ?? 0;
    const opponentScore =
      ((oppComp?.score as Record<string, unknown>)?.value as number) ?? 0;

    // Extract game leaders from Lakers competitor
    const leaders: {
      playerId: string;
      name: string;
      points: number;
      rebounds: number;
      assists: number;
      photoUrl: string;
    }[] = [];

    const lakersLeaders = ((lakersComp?.leaders as unknown[]) ?? []) as Record<string, unknown>[];
    for (const leaderGroup of lakersLeaders) {
      const leadersList = ((leaderGroup.leaders as unknown[]) ?? []) as Record<string, unknown>[];
      const top = leadersList[0];
      if (top) {
        const athlete = (top.athlete as Record<string, unknown>) ?? {};
        const athleteId = (athlete.id as string) ?? "";
        leaders.push({
          playerId: athleteId,
          name: (athlete.displayName as string) ?? "Player",
          points: Math.round((top.value as number) ?? 0),
          rebounds: 0,
          assists: 0,
          photoUrl: getPlayerPhoto(athleteId),
        });
      }
    }

    const period = (compStatus.period as number) ?? 1;
    const clock = (compStatus.displayClock as string) ?? "0:00";

    res.json(
      GetLakersLiveResponse.parse({
        isLive,
        game: {
          id: (lakersEvent.id as string) ?? "live",
          period,
          clock,
          lakersScore,
          opponentScore,
          opponent: (opponentTeam.displayName as string) ?? "Opponent",
          opponentLogo: `https://a.espncdn.com/i/teamlogos/nba/500/${opponentAbbr}.png`,
          lakersIsHome,
          status: (compStatusType.description as string) ?? "Final",
          leaders,
        },
        streamUrl: "https://icmzaar.com",
      })
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch live game");
    res.status(500).json({ error: "Failed to fetch live game" });
  }
});

router.get("/lakers/roster", async (req, res): Promise<void> => {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/teams/${LAKERS_TEAM_ID}/roster`
    )) as Record<string, unknown>;

    // athletes is a flat array of player objects
    const athleteList = ((data.athletes as unknown[]) ?? []) as Record<string, unknown>[];

    const players = athleteList.map((athlete) => {
      const id = (athlete.id as string) ?? "";
      const position = (athlete.position as Record<string, unknown>) ?? {};
      const athleteInjuries = ((athlete.injuries as unknown[]) ?? []) as Record<string, unknown>[];
      const statusData = (athlete.status as Record<string, unknown>) ?? {};
      const injuryNote =
        athleteInjuries.length > 0
          ? ((athleteInjuries[0].shortComment as string) ?? null)
          : null;
      const playerStatus =
        (statusData.type as string) === "injured" ? "Injured" : "Active";

      const headshot = (athlete.headshot as Record<string, unknown>) ?? {};
      const photoUrl =
        (headshot.href as string) ?? getPlayerPhoto(id);

      return {
        id,
        name: (athlete.displayName as string) ?? "Player",
        number: (athlete.jersey as string) ?? "00",
        position: (position.abbreviation as string) ?? "G",
        height: (athlete.displayHeight as string) ?? "--",
        weight: (athlete.displayWeight as string) ?? "--",
        age: (athlete.age as number) ?? null,
        college:
          ((athlete.college as Record<string, unknown>)?.name as string) ?? null,
        experience:
          ((athlete.experience as Record<string, unknown>)?.displayValue as string) ??
          "Rookie",
        photoUrl,
        stats: {
          ppg: 0,
          rpg: 0,
          apg: 0,
          spg: 0,
          bpg: 0,
          fgPct: 0,
          fg3Pct: 0,
          ftPct: 0,
          gamesPlayed: 0,
          minutesPerGame: 0,
        },
        status: playerStatus,
        injuryNote,
      };
    });

    // Fetch team record
    let teamRecord = "--";
    let teamRank = "--";
    try {
      const teamData = (await espnFetch(
        `${ESPN_BASE}/teams/${LAKERS_TEAM_ID}`
      )) as Record<string, unknown>;
      const team = (teamData.team as Record<string, unknown>) ?? {};
      const record = (team.record as Record<string, unknown>) ?? {};
      const items = ((record.items as unknown[]) ?? []) as Record<string, unknown>[];
      if (items.length > 0) {
        teamRecord = (items[0].summary as string) ?? "--";
      }
      teamRank = (team.standingSummary as string) ?? "--";
    } catch {
      // ignore team record errors
    }

    res.json(GetLakersRosterResponse.parse({ players, teamRecord, teamRank }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch roster");
    res.status(500).json({ error: "Failed to fetch roster" });
  }
});

router.get("/lakers/news", async (req, res): Promise<void> => {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/news?team=${LAKERS_TEAM_ID}&limit=20`
    )) as Record<string, unknown>;

    const rawArticles = ((data.articles as unknown[]) ?? []) as Record<string, unknown>[];

    const articles = rawArticles.map((a, index) => {
      const images = ((a.images as unknown[]) ?? []) as Record<string, unknown>[];
      const imageUrl = images.length > 0 ? (images[0].url as string) ?? null : null;

      // Navigate the links structure: links.web.href
      const links = (a.links as Record<string, unknown>) ?? {};
      const webLink = (links.web as Record<string, unknown>) ?? {};
      const href = (webLink.href as string) ?? "#";

      const categories = ((a.categories as unknown[]) ?? []) as Record<string, unknown>[];
      const firstCat = categories[0] ?? {};

      return {
        id: String((a.id as number) ?? index),
        headline: (a.headline as string) ?? "Lakers News",
        description: (a.description as string) ?? "",
        publishedAt: (a.published as string) ?? (a.lastModified as string) ?? new Date().toISOString(),
        source: (a.byline as string) ?? "ESPN",
        url: href,
        imageUrl,
        category:
          (firstCat.description as string) ?? (firstCat.type as string) ?? "Lakers",
      };
    });

    res.json(GetLakersNewsResponse.parse({ articles }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch news");
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

router.get("/lakers/injuries", async (req, res): Promise<void> => {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/teams/${LAKERS_TEAM_ID}/roster`
    )) as Record<string, unknown>;

    const athleteList = ((data.athletes as unknown[]) ?? []) as Record<string, unknown>[];
    const injuries: unknown[] = [];

    for (const athlete of athleteList) {
      const id = (athlete.id as string) ?? "";
      const position = (athlete.position as Record<string, unknown>) ?? {};
      const athleteInjuries = ((athlete.injuries as unknown[]) ?? []) as Record<string, unknown>[];
      const statusData = (athlete.status as Record<string, unknown>) ?? {};
      const statusType = (statusData.type as string) ?? "active";

      if (athleteInjuries.length > 0 || statusType === "injured") {
        const injuryData = athleteInjuries[0] as Record<string, unknown> | undefined;

        let playerStatus = "Questionable";
        if (injuryData) {
          const rawStatus = ((injuryData.status as string) ?? "").toLowerCase();
          if (rawStatus.includes("out")) playerStatus = "Out";
          else if (rawStatus.includes("questionable")) playerStatus = "Questionable";
          else if (rawStatus.includes("probable")) playerStatus = "Probable";
          else if (rawStatus.includes("day-to-day")) playerStatus = "Day-To-Day";
          else playerStatus = (injuryData.status as string) ?? "Questionable";
        } else if (statusType === "injured") {
          playerStatus = "Out";
        }

        const headshot = (athlete.headshot as Record<string, unknown>) ?? {};
        const photoUrl = (headshot.href as string) ?? getPlayerPhoto(id);

        injuries.push({
          playerId: id,
          playerName: (athlete.displayName as string) ?? "Player",
          number: (athlete.jersey as string) ?? "00",
          position: (position.abbreviation as string) ?? "G",
          status: playerStatus,
          injuryType:
            (injuryData?.shortComment as string) ??
            (injuryData?.longComment as string) ??
            null,
          returnDate: (injuryData?.returnDate as string) ?? null,
          photoUrl,
        });
      }
    }

    const lastUpdated = new Date().toISOString();
    res.json(GetLakersInjuriesResponse.parse({ injuries, lastUpdated }));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch injuries");
    res.status(500).json({ error: "Failed to fetch injuries" });
  }
});

router.get("/lakers/standings", async (req, res): Promise<void> => {
  try {
    const data = (await espnFetch(
      `${ESPN_V2}/standings`
    )) as Record<string, unknown>;

    const children = ((data.children as unknown[]) ?? []) as Record<string, unknown>[];

    // First child should be Western or Eastern Conference
    const allEntries: unknown[] = [];

    for (const conference of children) {
      const conferenceName = (conference.name as string) ?? "";
      // Only take Western Conference
      if (!conferenceName.toLowerCase().includes("western")) continue;

      const standingsData = (conference.standings as Record<string, unknown>) ?? {};
      const entries = ((standingsData.entries as unknown[]) ?? []) as Record<string, unknown>[];

      entries.forEach((entry, index) => {
        const team = (entry.team as Record<string, unknown>) ?? {};
        const teamId = (team.id as string) ?? "";
        const abbr = ((team.abbreviation as string) ?? "").toLowerCase();
        const stats = ((entry.stats as unknown[]) ?? []) as Record<string, unknown>[];

        const getStat = (name: string): string => {
          const s = stats.find(
            (st) => st.name === name || st.shortDisplayName === name
          );
          return (s?.displayValue as string) ?? "0";
        };

        const wins = parseInt(getStat("wins"), 10) || 0;
        const losses = parseInt(getStat("losses"), 10) || 0;
        const winPct = parseFloat(getStat("winPercent")) || 0;
        const gamesBehind = getStat("gamesBehind") || "-";

        allEntries.push({
          rank: index + 1,
          teamName: (team.displayName as string) ?? "Team",
          teamAbbr: (team.abbreviation as string) ?? "TM",
          wins,
          losses,
          winPct,
          gamesBehind,
          isLakers: teamId === LAKERS_TEAM_ID,
          logo: abbr
            ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`
            : `https://a.espncdn.com/i/teamlogos/nba/500/${teamId}.png`,
        });
      });
    }

    res.json(
      GetNbaStandingsResponse.parse({
        standings: allEntries,
        conference: "Western Conference",
      })
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch standings");
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

export default router;
