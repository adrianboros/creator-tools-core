export interface LeaderboardEntry {
  streamId: string;
  viewerExternalId: string;
  totalAmountMinor: number;
  currency: string;
  totalDurationSeconds?: number;
  rank?: number;
}

export interface LeaderboardQuery {
  streamId?: string;
  creatorId?: string;
  scope: 'per-stream' | 'all-time';
  currency?: string;
  limit?: number;
}
