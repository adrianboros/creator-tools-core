import type {
  AnalyticsTimeframe,
  ComputeAnalyticsInput,
  PaymentAnalyticsSnapshot,
  PaymentEventCounts,
  PaymentTotals,
  TimeBucket,
} from './types.js';
import type { SupportEvent } from '../events.js';

export function computePaymentAnalytics(input: ComputeAnalyticsInput): PaymentAnalyticsSnapshot {
  const now = input.now ?? new Date();
  const { from, bucketSizeMs } = resolveWindow(input.timeframe, now);

  const inWindow = input.supportEvents.filter((evt) => {
    const t = Date.parse(evt.occurredAt);
    return !Number.isNaN(t) && t >= from.getTime() && t <= now.getTime();
  });

  const counts: PaymentEventCounts = {
    totalEvents: 0,
    webMonetizationEvents: 0,
    tipEvents: 0,
    redemptionEvents: 0,
  };

  let totalAmountMinor = 0;
  const supporters = new Set<string>();

  const bucketsMap = new Map<number, { totalAmountMinor: number; eventCount: number }>();

  for (const evt of inWindow) {
    counts.totalEvents += 1;
    switch (evt.kind) {
      case 'web-monetization':
        counts.webMonetizationEvents += 1;
        break;
      case 'tip':
        counts.tipEvents += 1;
        break;
      case 'redemption':
        counts.redemptionEvents += 1;
        break;
    }

    if (typeof evt.amountMinor === 'number') {
      totalAmountMinor += evt.amountMinor;
    }

    if (evt.viewerExternalId) {
      supporters.add(evt.viewerExternalId);
    }

    const t = Date.parse(evt.occurredAt);
    if (!Number.isNaN(t) && bucketSizeMs > 0) {
      const bucketIndex = Math.floor((t - from.getTime()) / bucketSizeMs);
      const key = bucketIndex * bucketSizeMs + from.getTime();
      const current = bucketsMap.get(key) ?? { totalAmountMinor: 0, eventCount: 0 };
      current.eventCount += 1;
      if (typeof evt.amountMinor === 'number') {
        current.totalAmountMinor += evt.amountMinor;
      }
      bucketsMap.set(key, current);
    }
  }

  const totals: PaymentTotals = {
    totalAmountMinor,
    currency: inferCurrency(inWindow) ?? 'USD',
    uniqueSupporters: supporters.size,
  };

  const buckets: TimeBucket[] = Array.from(bucketsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([startMs, agg]) => ({
      start: new Date(startMs).toISOString(),
      end: new Date(startMs + bucketSizeMs).toISOString(),
      totalAmountMinor: agg.totalAmountMinor,
      eventCount: agg.eventCount,
    }));

  return {
    streamId: input.streamId,
    creatorId: input.creatorId,
    timeframe: input.timeframe,
    counts,
    totals,
    buckets: buckets.length > 0 ? buckets : undefined,
  };
}

function resolveWindow(timeframe: AnalyticsTimeframe, now: Date): { from: Date; bucketSizeMs: number } {
  const msHour = 60 * 60 * 1000;
  const msDay = 24 * msHour;

  switch (timeframe) {
    case 'last_24h':
      return { from: new Date(now.getTime() - msDay), bucketSizeMs: msHour };
    case 'last_7d':
      return { from: new Date(now.getTime() - 7 * msDay), bucketSizeMs: msDay };
    case 'last_30d':
      return { from: new Date(now.getTime() - 30 * msDay), bucketSizeMs: msDay };
    case 'all_time':
    default:
      return { from: new Date(0), bucketSizeMs: msDay };
  }
}

function inferCurrency(events: SupportEvent[]): string | undefined {
  for (const evt of events) {
    if (evt.currency) return evt.currency;
  }
  return undefined;
}

export * from './types.js';
