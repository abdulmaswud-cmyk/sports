import { useEffect, useMemo, useState } from 'react';

export type Sport = 'soccer' | 'basketball' | 'baseball';

export type SportsFact = {
  id: string;
  sport: Sport;
  emoji: string;
  color: string;
  title: string;
  subtitle?: string;
};

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

type State = {
  facts: SportsFact[];
  loading: boolean;
  error: string | null;
};

const FALLBACK_FACTS: SportsFact[] = [
  {
    id: 'fallback-soccer-1',
    sport: 'soccer',
    emoji: '⚽',
    color: '#22c55e',
    title: 'Soccer',
    subtitle: 'Trivia boost: quick feet, quick points.',
  },
  {
    id: 'fallback-basketball-1',
    sport: 'basketball',
    emoji: '🏀',
    color: '#f97316',
    title: 'Basketball',
    subtitle: 'League facts keep your score climbing.',
  },
  {
    id: 'fallback-baseball-1',
    sport: 'baseball',
    emoji: '⚾',
    color: '#60a5fa',
    title: 'Baseball',
    subtitle: 'Collect teams to power up your run.',
  },
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function toFactsFromTeams(args: {
  teams: Array<{
    idTeam?: string;
    strTeam?: string;
    strLeague?: string;
    strStadium?: string;
    strCountry?: string;
  }>;
  sport: Sport;
  emoji: string;
  color: string;
}): SportsFact[] {
  const { teams, sport, emoji, color } = args;
  return teams
    .filter((t) => t.idTeam && t.strTeam)
    .slice(0, 40)
    .map((t) => ({
      id: `${sport}-team-${t.idTeam}`,
      sport,
      emoji,
      color,
      title: String(t.strTeam),
      subtitle: [t.strLeague, t.strCountry, t.strStadium].filter(Boolean).join(' • ') || undefined,
    }));
}

function toFactsFromLeagues(args: {
  leagues: Array<{ idLeague?: string; strLeague?: string; strSport?: string; strCountry?: string }>;
}): SportsFact[] {
  const { leagues } = args;
  return leagues
    .filter((l) => l.idLeague && l.strLeague && l.strSport === 'Basketball')
    .slice(0, 60)
    .map((l) => ({
      id: `basketball-league-${l.idLeague}`,
      sport: 'basketball',
      emoji: '🏀',
      color: '#f97316',
      title: String(l.strLeague),
      subtitle: l.strCountry ? `Country: ${l.strCountry}` : undefined,
    }));
}

let cachedFacts: SportsFact[] | null = null;

export function useSportsData() {
  const [state, setState] = useState<State>(() => ({
    facts: cachedFacts ?? FALLBACK_FACTS,
    loading: cachedFacts == null,
    error: null,
  }));

  useEffect(() => {
    let alive = true;
    if (cachedFacts != null) return;

    (async () => {
      try {
        const [soccer, baseball, leagues] = await Promise.all([
          fetchJson<{ teams?: any[] }>(
            `${BASE_URL}/search_all_teams.php?l=${encodeURIComponent('English Premier League')}`
          ),
          fetchJson<{ teams?: any[] }>(`${BASE_URL}/search_all_teams.php?l=${encodeURIComponent('MLB')}`),
          fetchJson<{ leagues?: any[] }>(`${BASE_URL}/all_leagues.php`),
        ]);

        const facts: SportsFact[] = [
          ...toFactsFromTeams({
            teams: soccer.teams ?? [],
            sport: 'soccer',
            emoji: '⚽',
            color: '#22c55e',
          }),
          ...toFactsFromLeagues({ leagues: leagues.leagues ?? [] }),
          ...toFactsFromTeams({
            teams: baseball.teams ?? [],
            sport: 'baseball',
            emoji: '⚾',
            color: '#60a5fa',
          }),
        ];

        cachedFacts = facts.length ? facts : FALLBACK_FACTS;
        if (!alive) return;
        setState({ facts: cachedFacts, loading: false, error: null });
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : 'Failed to load sports data';
        if (!alive) return;
        cachedFacts = FALLBACK_FACTS;
        setState({ facts: FALLBACK_FACTS, loading: false, error: msg });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const bySport = useMemo(() => {
    const map: Record<Sport, SportsFact[]> = { soccer: [], basketball: [], baseball: [] };
    for (const f of state.facts) map[f.sport].push(f);
    return map;
  }, [state.facts]);

  return { ...state, bySport };
}

