/** Report reasons accepted by the backend's /api/report. */
export const REPORT_REASONS = ['contact-info', 'harassment', 'sexual', 'names-a-person', 'spam', 'other'] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
