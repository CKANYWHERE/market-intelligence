/**
 * Central mock data export
 *
 * Usage in tests or dev seeding:
 *   import { mockData } from '@/prisma/mock';
 *   console.log(mockData.economicEvents[0]);
 */

export { mockEconomicEvents } from './economic-events';
export { mockEarningsEvents } from './earnings-events';
export { mockIpoEvents } from './ipo-events';
export { mockBreakingEvents } from './breaking-events';
export { mockEtfQuotes } from './etf-quotes';
export { mockFredSnapshots } from './fred-snapshots';

export type { MockEconomicEvent } from './economic-events';
export type { MockEarningsEvent } from './earnings-events';
export type { MockIpoEvent } from './ipo-events';
export type { MockBreakingEvent } from './breaking-events';
export type { MockEtfQuote } from './etf-quotes';
export type { MockFredSnapshot } from './fred-snapshots';
