import { cn } from '@/lib/utils';
import { GameScore, PlayoffRound } from '@/types/sports';
import Image from 'next/image';

interface PlayoffBracketProps {
  games: GameScore[];
}

interface TeamSlot {
  name: string;
  logo?: string;
  score?: number;
  isWinner?: boolean;
  isLoser?: boolean;
}

interface MatchupData {
  id?: string;
  topTeam: TeamSlot;
  bottomTeam: TeamSlot;
  status: 'scheduled' | 'live' | 'final' | 'tbd';
  startTime?: Date;
  quarter?: string;
  timeRemaining?: string;
  game?: GameScore;
}

// Helper to determine winner
function getWinner(game: GameScore): 'home' | 'away' | null {
  if (game.status !== 'final') return null;
  if (game.homeScore > game.awayScore) return 'home';
  if (game.awayScore > game.homeScore) return 'away';
  return null;
}

// Get winner team name from a game
function getWinnerTeam(game: GameScore): string | null {
  const winner = getWinner(game);
  if (winner === 'home') return game.homeTeam;
  if (winner === 'away') return game.awayTeam;
  return null;
}

// Get winner team logo from a game
function getWinnerLogo(game: GameScore): string | undefined {
  const winner = getWinner(game);
  if (winner === 'home') return game.homeTeamLogo;
  if (winner === 'away') return game.awayTeamLogo;
  return undefined;
}

/**
 * Generate all playoff games including placeholders with winners advancing
 * This function takes completed playoff games and creates placeholder games
 * for future rounds with winners from previous rounds filled in
 */
export function generateAllPlayoffGames(games: GameScore[]): GameScore[] {
  // Merge hardcoded Wild Card games with fetched games
  const mergedGames = [...games];
  const hardcodedWildCardIds = new Set(HARDCODED_WILD_CARD_GAMES.map(g => g.id));
  
  // Remove any existing Wild Card games from fetched games
  const filteredGames = mergedGames.filter(game => 
    !(game.playoffRound === 'Wild Card' && hardcodedWildCardIds.has(game.id))
  );
  
  // Add hardcoded Wild Card games
  const allGames = [...filteredGames, ...HARDCODED_WILD_CARD_GAMES];
  
  // Group games by round
  const gamesByRound: Record<PlayoffRound, GameScore[]> = {
    'Wild Card': [],
    'Divisional': [],
    'Conference Championship': [],
    'Super Bowl': [],
  };

  allGames.forEach(game => {
    if (game.playoffRound && gamesByRound[game.playoffRound]) {
      gamesByRound[game.playoffRound].push(game);
    }
  });

  // Sort games by date within each round
  Object.values(gamesByRound).forEach(roundGames => {
    roundGames.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  });

  // Separate by conference
  const afcWildCard = gamesByRound['Wild Card'].filter(isAFCGame);
  const nfcWildCard = gamesByRound['Wild Card'].filter(g => !isAFCGame(g));
  
  // Get winners from Wild Card round
  const afcWildCardWinners = afcWildCard
    .filter(g => g.status === 'final')
    .map(g => ({ team: getWinnerTeam(g), logo: getWinnerLogo(g) }))
    .filter((w): w is { team: string; logo: string | undefined } => w.team !== null);
  
  const nfcWildCardWinners = nfcWildCard
    .filter(g => g.status === 'final')
    .map(g => ({ team: getWinnerTeam(g), logo: getWinnerLogo(g) }))
    .filter((w): w is { team: string; logo: string | undefined } => w.team !== null);

  // Get existing Divisional games
  const afcDivisional = gamesByRound['Divisional'].filter(isAFCGame);
  const nfcDivisional = gamesByRound['Divisional'].filter(g => !isAFCGame(g));
  
  // Create placeholder Divisional games with winners if needed
  const generateDivisionalGames = (winners: Array<{ team: string; logo: string | undefined }>, existing: GameScore[], conference: 'AFC' | 'NFC'): GameScore[] => {
    const result = [...existing];
    const needed = 2 - existing.length;
    
    if (needed > 0 && winners.length >= needed * 2) {
      // Create placeholder games with winners
      for (let i = 0; i < needed; i++) {
        const winner1 = winners[i * 2];
        const winner2 = winners[i * 2 + 1];
        
        if (winner1 && winner2) {
          // Get logos if not already provided
          const logo1 = winner1.logo || getTeamLogo(winner1.team);
          const logo2 = winner2.logo || getTeamLogo(winner2.team);
          
          result.push({
            id: `placeholder-div-${conference}-${i}`,
            sport: 'NBA',
            homeTeam: winner2.team,
            awayTeam: winner1.team,
            homeScore: 0,
            awayScore: 0,
            homeTeamLogo: logo2 || undefined,
            awayTeamLogo: logo1 || undefined,
            status: 'scheduled',
            startTime: new Date('2026-01-18T00:00:00'), // Placeholder date
            playoffRound: 'Divisional',
          });
        }
      }
    }
    
    return result;
  };

  const allAfcDivisional = generateDivisionalGames(afcWildCardWinners, afcDivisional, 'AFC');
  const allNfcDivisional = generateDivisionalGames(nfcWildCardWinners, nfcDivisional, 'NFC');

  // Get winners from Divisional round
  const afcDivisionalWinners = allAfcDivisional
    .filter(g => g.status === 'final')
    .map(g => ({ team: getWinnerTeam(g), logo: getWinnerLogo(g) }))
    .filter((w): w is { team: string; logo: string | undefined } => w.team !== null);
  
  const nfcDivisionalWinners = allNfcDivisional
    .filter(g => g.status === 'final')
    .map(g => ({ team: getWinnerTeam(g), logo: getWinnerLogo(g) }))
    .filter((w): w is { team: string; logo: string | undefined } => w.team !== null);

  // Get existing Championship games
  const afcChampionship = gamesByRound['Conference Championship'].filter(isAFCGame);
  const nfcChampionship = gamesByRound['Conference Championship'].filter(g => !isAFCGame(g));
  
  // Create placeholder Championship games with winners if needed
  const generateChampionshipGame = (winners: Array<{ team: string; logo: string | undefined }>, existing: GameScore[], conference: 'AFC' | 'NFC'): GameScore[] => {
    const result = [...existing];
    
    if (result.length === 0 && winners.length >= 2) {
      // Get logos if not already provided
      const logo1 = winners[0].logo || getTeamLogo(winners[0].team);
      const logo2 = winners[1].logo || getTeamLogo(winners[1].team);
      
      result.push({
        id: `placeholder-champ-${conference}`,
        sport: 'NBA',
        homeTeam: winners[1].team,
        awayTeam: winners[0].team,
        homeScore: 0,
        awayScore: 0,
        homeTeamLogo: logo2 || undefined,
        awayTeamLogo: logo1 || undefined,
        status: 'scheduled',
        startTime: new Date('2026-01-25T00:00:00'), // Placeholder date
        playoffRound: 'Conference Championship',
      });
    }
    
    return result;
  };

  const allAfcChampionship = generateChampionshipGame(afcDivisionalWinners, afcChampionship, 'AFC');
  const allNfcChampionship = generateChampionshipGame(nfcDivisionalWinners, nfcChampionship, 'NFC');

  // Get winners from Championship round
  const afcChampion = allAfcChampionship
    .filter(g => g.status === 'final')
    .map(g => getWinnerTeam(g))
    .find(w => w !== null);
  
  const nfcChampion = allNfcChampionship
    .filter(g => g.status === 'final')
    .map(g => getWinnerTeam(g))
    .find(w => w !== null);

  // Get existing Super Bowl
  const superBowl = gamesByRound['Super Bowl'];
  
  // Create placeholder Super Bowl with winners if needed
  const allSuperBowl = [...superBowl];
  if (allSuperBowl.length === 0 && afcChampion && nfcChampion) {
    const afcChampGame = allAfcChampionship.find(g => g.status === 'final');
    const nfcChampGame = allNfcChampionship.find(g => g.status === 'final');
    
    // Get logos - try from championship games first, then fallback to team logo lookup
    const nfcLogo = nfcChampGame ? getWinnerLogo(nfcChampGame) : getTeamLogo(nfcChampion);
    const afcLogo = afcChampGame ? getWinnerLogo(afcChampGame) : getTeamLogo(afcChampion);
    
    allSuperBowl.push({
      id: 'placeholder-superbowl',
      sport: 'NBA',
      homeTeam: nfcChampion, // NFC is typically home team
      awayTeam: afcChampion,
      homeScore: 0,
      awayScore: 0,
      homeTeamLogo: nfcLogo || undefined,
      awayTeamLogo: afcLogo || undefined,
      status: 'scheduled',
      startTime: new Date('2026-02-09T00:00:00'), // Super Bowl date
      playoffRound: 'Super Bowl',
    });
  }

  // Combine all games - use Set to avoid duplicates
  const allGameIds = new Set(allGames.map(g => g.id));
  const combinedGames = [...allGames];
  
  // Add Divisional games that aren't already in allGames
  [...allAfcDivisional, ...allNfcDivisional].forEach(game => {
    if (!allGameIds.has(game.id)) {
      combinedGames.push(game);
      allGameIds.add(game.id);
    }
  });
  
  // Add Championship games that aren't already in combinedGames
  [...allAfcChampionship, ...allNfcChampionship].forEach(game => {
    if (!allGameIds.has(game.id)) {
      combinedGames.push(game);
      allGameIds.add(game.id);
    }
  });
  
  // Add Super Bowl games that aren't already in combinedGames
  allSuperBowl.forEach(game => {
    if (!allGameIds.has(game.id)) {
      combinedGames.push(game);
      allGameIds.add(game.id);
    }
  });

  // Sort by round order, then by date
  const roundOrder: Record<PlayoffRound, number> = {
    'Wild Card': 1,
    'Divisional': 2,
    'Conference Championship': 3,
    'Super Bowl': 4,
  };

  return combinedGames.sort((a, b) => {
    const aRound = a.playoffRound ? roundOrder[a.playoffRound] : 0;
    const bRound = b.playoffRound ? roundOrder[b.playoffRound] : 0;
    if (aRound !== bRound) {
      return aRound - bRound;
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });
}

// Helper to get team short name
function getShortName(fullName: string): string {
  // Extract just the team name (e.g., "Buffalo Bills" -> "Bills")
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
}

// Create empty TBD matchup
function createTBDMatchup(): MatchupData {
  return {
    topTeam: { name: 'TBD' },
    bottomTeam: { name: 'TBD' },
    status: 'tbd',
  };
}

// Convert game to matchup data
function gameToMatchup(game: GameScore): MatchupData {
  const winner = getWinner(game);
  // Always include scores if game is live or final
  // For scheduled games, only show scores if they're explicitly set (not 0)
  const showAwayScore = game.status !== 'scheduled' || (game.awayScore !== undefined && game.awayScore !== null && game.awayScore > 0);
  const showHomeScore = game.status !== 'scheduled' || (game.homeScore !== undefined && game.homeScore !== null && game.homeScore > 0);
  
  return {
    id: game.id,
    topTeam: {
      name: game.awayTeam,
      logo: game.awayTeamLogo,
      score: showAwayScore ? game.awayScore : undefined,
      isWinner: winner === 'away',
      isLoser: winner === 'home',
    },
    bottomTeam: {
      name: game.homeTeam,
      logo: game.homeTeamLogo,
      score: showHomeScore ? game.homeScore : undefined,
      isWinner: winner === 'home',
      isLoser: winner === 'away',
    },
    status: game.status,
    startTime: game.startTime,
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    game,
  };
}

// AFC and NFC team identifiers
const AFC_TEAMS = [
  'Bills', 'Dolphins', 'Patriots', 'Jets',
  'Ravens', 'Bengals', 'Browns', 'Steelers',
  'Texans', 'Colts', 'Jaguars', 'Titans',
  'Chiefs', 'Chargers', 'Raiders', 'Broncos',
];

const NFC_TEAMS = [
  'Cowboys', 'Giants', 'Eagles', 'Commanders',
  'Bears', 'Lions', 'Packers', 'Vikings',
  'Falcons', 'Panthers', 'Saints', 'Buccaneers',
  '49ers', 'Seahawks', 'Rams', 'Cardinals',
];

function isAFCTeam(teamName: string): boolean {
  return AFC_TEAMS.some(t => teamName.includes(t));
}

function isNFCTeam(teamName: string): boolean {
  return NFC_TEAMS.some(t => teamName.includes(t));
}

function isAFCGame(game: GameScore): boolean {
  return isAFCTeam(game.homeTeam) || isAFCTeam(game.awayTeam);
}

// Helper function to get ESPN team logo URL
function getTeamLogo(teamName: string): string {
  const teamAbbrevMap: Record<string, string> = {
    'Houston Texans': 'hou',
    'Pittsburgh Steelers': 'pit',
    'New England Patriots': 'ne',
    'Los Angeles Chargers': 'lac',
    'Buffalo Bills': 'buf',
    'Jacksonville Jaguars': 'jax',
    'San Francisco 49ers': 'sf',
    'Philadelphia Eagles': 'phi',
    'Chicago Bears': 'chi',
    'Green Bay Packers': 'gb',
    'Los Angeles Rams': 'lar',
    'Carolina Panthers': 'car',
    // Add more teams that might advance
    'Kansas City Chiefs': 'kc',
    'Baltimore Ravens': 'bal',
    'Cleveland Browns': 'cle',
    'Cincinnati Bengals': 'cin',
    'Miami Dolphins': 'mia',
    'New York Jets': 'nyj',
    'Tennessee Titans': 'ten',
    'Indianapolis Colts': 'ind',
    'Denver Broncos': 'den',
    'Las Vegas Raiders': 'lv',
    'Dallas Cowboys': 'dal',
    'New York Giants': 'nyg',
    'Washington Commanders': 'wsh',
    'Detroit Lions': 'det',
    'Minnesota Vikings': 'min',
    'Atlanta Falcons': 'atl',
    'New Orleans Saints': 'no',
    'Tampa Bay Buccaneers': 'tb',
    'Seattle Seahawks': 'sea',
    'Arizona Cardinals': 'ari',
  };
  
  const abbrev = teamAbbrevMap[teamName];
  if (!abbrev) {
    // Try to derive abbreviation from team name
    const parts = teamName.split(' ');
    const lastPart = parts[parts.length - 1].toLowerCase();
    // Common abbreviations
    if (lastPart === '49ers') return 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png';
    return '';
  }
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev}.png`;
}

// Hardcoded Wild Card games
const HARDCODED_WILD_CARD_GAMES: GameScore[] = [
  // AFC Wild Card Games
  {
    id: 'hardcoded-wc-afc-1',
    sport: 'NBA',
    homeTeam: 'Pittsburgh Steelers',
    awayTeam: 'Houston Texans',
    homeScore: 6,
    awayScore: 30,
    homeTeamLogo: getTeamLogo('Pittsburgh Steelers'),
    awayTeamLogo: getTeamLogo('Houston Texans'),
    status: 'final',
    startTime: new Date('2026-01-12T00:00:00'),
    playoffRound: 'Wild Card',
  },
  {
    id: 'hardcoded-wc-afc-2',
    sport: 'NBA',
    homeTeam: 'New England Patriots',
    awayTeam: 'Los Angeles Chargers',
    homeScore: 16,
    awayScore: 3,
    homeTeamLogo: getTeamLogo('New England Patriots'),
    awayTeamLogo: getTeamLogo('Los Angeles Chargers'),
    status: 'final',
    startTime: new Date('2026-01-11T00:00:00'),
    playoffRound: 'Wild Card',
  },
  {
    id: 'hardcoded-wc-afc-3',
    sport: 'NBA',
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'Buffalo Bills',
    homeScore: 24,
    awayScore: 27,
    homeTeamLogo: getTeamLogo('Jacksonville Jaguars'),
    awayTeamLogo: getTeamLogo('Buffalo Bills'),
    status: 'final',
    startTime: new Date('2026-01-11T00:00:00'),
    playoffRound: 'Wild Card',
  },
  // NFC Wild Card Games
  {
    id: 'hardcoded-wc-nfc-1',
    sport: 'NBA',
    homeTeam: 'Philadelphia Eagles',
    awayTeam: 'San Francisco 49ers',
    homeScore: 19,
    awayScore: 23,
    homeTeamLogo: getTeamLogo('Philadelphia Eagles'),
    awayTeamLogo: getTeamLogo('San Francisco 49ers'),
    status: 'final',
    startTime: new Date('2026-01-11T00:00:00'),
    playoffRound: 'Wild Card',
  },
  {
    id: 'hardcoded-wc-nfc-2',
    sport: 'NBA',
    homeTeam: 'Chicago Bears',
    awayTeam: 'Green Bay Packers',
    homeScore: 31,
    awayScore: 27,
    homeTeamLogo: getTeamLogo('Chicago Bears'),
    awayTeamLogo: getTeamLogo('Green Bay Packers'),
    status: 'final',
    startTime: new Date('2026-01-10T00:00:00'),
    playoffRound: 'Wild Card',
  },
  {
    id: 'hardcoded-wc-nfc-3',
    sport: 'NBA',
    homeTeam: 'Carolina Panthers',
    awayTeam: 'Los Angeles Rams',
    homeScore: 31,
    awayScore: 34,
    homeTeamLogo: getTeamLogo('Carolina Panthers'),
    awayTeamLogo: getTeamLogo('Los Angeles Rams'),
    status: 'final',
    startTime: new Date('2026-01-10T00:00:00'),
    playoffRound: 'Wild Card',
  },
];

export function PlayoffBracket({ games }: PlayoffBracketProps) {
  // Merge hardcoded Wild Card games with fetched games
  // Hardcoded games take precedence for Wild Card round
  const mergedGames = [...games];
  const hardcodedWildCardIds = new Set(HARDCODED_WILD_CARD_GAMES.map(g => g.id));
  
  // Remove any existing Wild Card games from fetched games
  const filteredGames = mergedGames.filter(game => 
    !(game.playoffRound === 'Wild Card' && hardcodedWildCardIds.has(game.id))
  );
  
  // Add hardcoded Wild Card games
  const allGames = [...filteredGames, ...HARDCODED_WILD_CARD_GAMES];
  
  // Group games by round and conference
  const gamesByRound: Record<PlayoffRound, GameScore[]> = {
    'Wild Card': [],
    'Divisional': [],
    'Conference Championship': [],
    'Super Bowl': [],
  };

  allGames.forEach(game => {
    if (game.playoffRound && gamesByRound[game.playoffRound]) {
      gamesByRound[game.playoffRound].push(game);
    }
  });

  // Debug logging (commented out for production)
  // console.log('PlayoffBracket - Games by round:', {
  //   'Wild Card': gamesByRound['Wild Card'].length,
  //   'Divisional': gamesByRound['Divisional'].length,
  //   'Conference Championship': gamesByRound['Conference Championship'].length,
  //   'Super Bowl': gamesByRound['Super Bowl'].length,
  // });

  // Sort games by date within each round
  Object.values(gamesByRound).forEach(roundGames => {
    roundGames.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  });

  // Separate by conference
  const afcWildCard = gamesByRound['Wild Card'].filter(isAFCGame);
  const nfcWildCard = gamesByRound['Wild Card'].filter(g => !isAFCGame(g));
  const afcDivisional = gamesByRound['Divisional'].filter(isAFCGame);
  const nfcDivisional = gamesByRound['Divisional'].filter(g => !isAFCGame(g));
  const afcChampionship = gamesByRound['Conference Championship'].filter(isAFCGame);
  const nfcChampionship = gamesByRound['Conference Championship'].filter(g => !isAFCGame(g));
  const superBowl = gamesByRound['Super Bowl'];

  // Create matchup data with TBD placeholders
  const createMatchups = (games: GameScore[], expectedCount: number): MatchupData[] => {
    const matchups = games.map(gameToMatchup);
    while (matchups.length < expectedCount) {
      matchups.push(createTBDMatchup());
    }
    return matchups;
  };

  const afcWildCardMatchups = createMatchups(afcWildCard, 3);
  const nfcWildCardMatchups = createMatchups(nfcWildCard, 3);
  const afcDivisionalMatchups = createMatchups(afcDivisional, 2);
  const nfcDivisionalMatchups = createMatchups(nfcDivisional, 2);
  const afcChampionshipMatchup = createMatchups(afcChampionship, 1)[0];
  const nfcChampionshipMatchup = createMatchups(nfcChampionship, 1)[0];
  const superBowlMatchup = superBowl.length > 0 ? gameToMatchup(superBowl[0]) : createTBDMatchup();

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[1200px] p-4">
        {/* Header */}
        <div className="grid grid-cols-7 gap-4 mb-6">
          <div className="col-span-3 text-center">
            <h2 className="text-2xl font-bold text-blue-500">AFC</h2>
          </div>
          <div className="col-span-3 text-center">
            <h2 className="text-2xl font-bold text-red-500">NFC</h2>
          </div>
        </div>

        {/* Round Labels */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          <div className="text-center text-sm font-semibold text-muted-foreground">Wild Card</div>
          <div className="text-center text-sm font-semibold text-muted-foreground">Divisional</div>
          <div className="text-center text-sm font-semibold text-muted-foreground">Conference</div>
          <div></div>
          <div className="text-center text-sm font-semibold text-muted-foreground">Conference</div>
          <div className="text-center text-sm font-semibold text-muted-foreground">Divisional</div>
          <div className="text-center text-sm font-semibold text-muted-foreground">Wild Card</div>
        </div>

        {/* Bracket Grid */}
        <div className="grid grid-cols-7 gap-4 items-center">
          {/* AFC Wild Card */}
          <div className="flex flex-col space-y-4 justify-center">
            {afcWildCardMatchups.map((matchup, i) => (
              <MatchupCard key={matchup.id || `afc-wc-${i}`} matchup={matchup} conference="AFC" />
            ))}
          </div>

          {/* AFC Divisional */}
          <div className="flex flex-col space-y-8 justify-center py-8">
            {afcDivisionalMatchups.map((matchup, i) => (
              <MatchupCard key={matchup.id || `afc-div-${i}`} matchup={matchup} conference="AFC" />
            ))}
          </div>

          {/* AFC Championship */}
          <div className="space-y-8 py-8">
            <MatchupCard matchup={afcChampionshipMatchup} conference="AFC" isChampionship />
          </div>

          {/* Super Bowl */}
          <div className="flex items-center justify-center">
            <SuperBowlCard matchup={superBowlMatchup} />
          </div>

          {/* NFC Championship */}
          <div className="space-y-8 py-8">
            <MatchupCard matchup={nfcChampionshipMatchup} conference="NFC" isChampionship />
          </div>

          {/* NFC Divisional */}
          <div className="flex flex-col space-y-8 justify-center py-8">
            {nfcDivisionalMatchups.map((matchup, i) => (
              <MatchupCard key={matchup.id || `nfc-div-${i}`} matchup={matchup} conference="NFC" />
            ))}
          </div>

          {/* NFC Wild Card */}
          <div className="flex flex-col space-y-4 justify-center">
            {nfcWildCardMatchups.map((matchup, i) => (
              <MatchupCard key={matchup.id || `nfc-wc-${i}`} matchup={matchup} conference="NFC" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchupCardProps {
  matchup: MatchupData;
  conference: 'AFC' | 'NFC';
  isChampionship?: boolean;
}

function MatchupCard({ matchup, conference, isChampionship }: MatchupCardProps) {
  const isTBD = matchup.status === 'tbd';
  const isLive = matchup.status === 'live';
  const isFinal = matchup.status === 'final';
  const isScheduled = matchup.status === 'scheduled';

  const borderColor = conference === 'AFC' ? 'border-blue-500/30' : 'border-red-500/30';
  const accentColor = conference === 'AFC' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 bg-card overflow-hidden transition-all",
        borderColor,
        isLive && "ring-2 ring-green-500 border-green-500",
        isTBD && "opacity-50",
        isChampionship && "scale-105"
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs text-center py-0.5 font-semibold">
          LIVE {matchup.quarter && `- ${matchup.quarter}`} {matchup.timeRemaining && matchup.timeRemaining}
        </div>
      )}

      <div className={cn("divide-y divide-border", isLive && "mt-5")}>
        <TeamRow team={matchup.topTeam} isTBD={isTBD} showScore={isLive || isFinal || (matchup.topTeam.score !== undefined && matchup.topTeam.score !== null)} />
        <TeamRow team={matchup.bottomTeam} isTBD={isTBD} showScore={isLive || isFinal || (matchup.bottomTeam.score !== undefined && matchup.bottomTeam.score !== null)} />
      </div>

      {/* Game time for scheduled games */}
      {isScheduled && matchup.startTime && (
        <div className="bg-muted/50 px-2 py-1 text-center">
          <div className="text-xs text-muted-foreground">
            {matchup.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="text-xs font-semibold">
            {matchup.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* Final indicator */}
      {isFinal && (
        <div className="bg-muted/50 px-2 py-1 text-center">
          <span className="text-xs font-semibold text-muted-foreground">FINAL</span>
        </div>
      )}

      {/* TBD indicator */}
      {isTBD && (
        <div className="bg-muted/30 px-2 py-1 text-center">
          <span className="text-xs text-muted-foreground">TBD</span>
        </div>
      )}
    </div>
  );
}

interface TeamRowProps {
  team: TeamSlot;
  isTBD: boolean;
  showScore: boolean;
}

function TeamRow({ team, isTBD, showScore }: TeamRowProps) {
  const isTBDTeam = team.name === 'TBD';

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-2 min-h-[44px]",
        team.isWinner && "bg-green-500/10",
        team.isLoser && "opacity-50"
      )}
    >
      {/* Team Logo */}
      {team.logo ? (
        <div className="relative w-7 h-7 flex-shrink-0">
          <Image
            src={team.logo}
            alt={team.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className={cn(
          "w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
          isTBDTeam ? "bg-muted text-muted-foreground" : "bg-muted"
        )}>
          {isTBDTeam ? '?' : team.name.substring(0, 2).toUpperCase()}
        </div>
      )}

      {/* Team Name */}
      <div className={cn(
        "flex-1 text-sm font-medium truncate",
        team.isWinner && "font-bold",
        isTBDTeam && "text-muted-foreground italic"
      )}>
        {isTBDTeam ? 'TBD' : getShortName(team.name)}
      </div>

      {/* Score */}
      {showScore && team.score !== undefined && (
        <div className={cn(
          "text-lg font-bold min-w-[24px] text-right",
          team.isWinner && "text-green-500"
        )}>
          {team.score}
        </div>
      )}
    </div>
  );
}

interface SuperBowlCardProps {
  matchup: MatchupData;
}

function SuperBowlCard({ matchup }: SuperBowlCardProps) {
  const isTBD = matchup.status === 'tbd';
  const isLive = matchup.status === 'live';
  const isFinal = matchup.status === 'final';
  const isScheduled = matchup.status === 'scheduled';

  return (
    <div
      className={cn(
        "relative rounded-xl border-4 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent overflow-hidden w-full max-w-[200px]",
        isLive && "ring-2 ring-green-500 border-green-500"
      )}
    >
      {/* Trophy Header */}
      <div className="bg-yellow-500/20 px-3 py-2 text-center border-b border-yellow-500/30">
        <div className="text-2xl">🏆</div>
        <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">SUPER BOWL</div>
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="bg-green-500 text-white text-xs text-center py-1 font-semibold">
          LIVE {matchup.quarter && `- ${matchup.quarter}`} {matchup.timeRemaining && matchup.timeRemaining}
        </div>
      )}

      <div className="divide-y divide-border">
        <TeamRow team={matchup.topTeam} isTBD={isTBD} showScore={isLive || isFinal} />
        <TeamRow team={matchup.bottomTeam} isTBD={isTBD} showScore={isLive || isFinal} />
      </div>

      {/* Game time for scheduled games */}
      {isScheduled && matchup.startTime && (
        <div className="bg-muted/50 px-2 py-2 text-center border-t border-yellow-500/30">
          <div className="text-xs text-muted-foreground">
            {matchup.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="text-sm font-semibold">
            {matchup.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* Final indicator */}
      {isFinal && (
        <div className="bg-yellow-500/20 px-2 py-2 text-center border-t border-yellow-500/30">
          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">CHAMPION</span>
        </div>
      )}

      {/* TBD indicator */}
      {isTBD && (
        <div className="bg-muted/30 px-2 py-2 text-center">
          <span className="text-xs text-muted-foreground">Feb 9, 2025</span>
        </div>
      )}
    </div>
  );
}
