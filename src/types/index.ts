export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TournamentWithStats {
  id: string;
  name: string;
  season: number;
  description: string | null;
  status: string;
  regStart: Date;
  regEnd: Date;
  startDate: Date;
  endDate: Date;
  maxPlayers: number;
  prizePool: number;
  _count: {
    registrations: number;
    stages: number;
  };
}

export interface StandingsEntry {
  playerId: string;
  playerName: string;
  ign: string;
  totalPoints: number;
  gamesPlayed: number;
  averagePlacement: number;
  bestPlacement: number;
  wins: number;
}

export interface GroupStanding {
  groupId: string;
  groupName: string;
  players: {
    playerId: string;
    ign: string;
    totalPoints: number;
    finalRank: number | null;
    gameResults: {
      gameNumber: number;
      placement: number;
      points: number;
    }[];
  }[];
}
