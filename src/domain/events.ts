export type StreamEventType =
  | 'STREAM_STARTED'
  | 'STREAM_ENDED'
  | 'VIEWER_JOINED'
  | 'VIEWER_LEFT'
  | 'CHAT_MESSAGE'
  | 'SUPPORT_EVENT';

export interface BaseEvent {
  id: string;
  streamId: string;
  occurredAt: string; // ISO timestamp
}

export interface StreamLifecycleEvent extends BaseEvent {
  type: 'STREAM_STARTED' | 'STREAM_ENDED';
  creatorId: string;
  title?: string;
}

export interface ViewerEvent extends BaseEvent {
  type: 'VIEWER_JOINED' | 'VIEWER_LEFT';
  viewerExternalId: string;
}

export interface ChatMessageEvent extends BaseEvent {
  type: 'CHAT_MESSAGE';
  viewerExternalId: string;
  text: string;
}

export type SupportKind = 'web-monetization' | 'tip' | 'redemption';

export interface SupportEvent extends BaseEvent {
  type: 'SUPPORT_EVENT';
  viewerExternalId: string;
  kind: SupportKind;
  amountMinor?: number; // optional, in minor units
  currency?: string;
  durationSeconds?: number; // for WM time-based support
  metadata?: Record<string, unknown>;
}

export type StreamEvent = StreamLifecycleEvent | ViewerEvent | ChatMessageEvent | SupportEvent;

export interface ChatAction {
  streamId: string;
  text: string;
}

export interface ViewerSession {
  id: string;
  streamId: string;
  viewerExternalId: string;
  walletPointer?: string;
  openPaymentsAccountId?: string;
  startedAt: string;
  lastSeenAt: string;
}

export interface Viewer {
  id: string;
  externalId: string;
}
