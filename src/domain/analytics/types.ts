import type { SupportEvent } from '../events.js';

export type AnalyticsTimeframe = 'last_24h' | 'last_7d' | 'last_30d' | 'all_time';

export interface PaymentEventCounts {
  totalEvents: number;
  webMonetizationEvents: number;
  tipEvents: number;
  redemptionEvents: number;
}

export interface PaymentTotals {
  totalAmountMinor: number;
  currency: string;
  uniqueSupporters: number;
}

export interface ViewerMetrics {
  viewCount: number;
  uniqueViewers: number;
}

export interface TimeBucket {
  /** ISO timestamp for bucket start (inclusive). */
  start: string;
  /** ISO timestamp for bucket end (exclusive). */
  end: string;
  totalAmountMinor: number;
  eventCount: number;
}

export interface PaymentAnalyticsSnapshot {
  streamId?: string;
  creatorId?: string;
  timeframe: AnalyticsTimeframe;
  counts: PaymentEventCounts;
  totals: PaymentTotals;
  viewerMetrics?: ViewerMetrics;
  /** Optional coarse buckets for charts (per hour/day depending on timeframe). */
  buckets?: TimeBucket[];
}

export interface ComputeAnalyticsInput {
  streamId?: string;
  creatorId?: string;
  timeframe: AnalyticsTimeframe;
  /** Support events already filtered to the relevant stream/creator if desired. */
  supportEvents: SupportEvent[];
  /** Optional reference time; defaults to `new Date()`. */
  now?: Date;
}
