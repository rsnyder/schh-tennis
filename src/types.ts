export type ScrapeErrorCode =
  | "SITE_DOWN"
  | "LOGIN_FAILED"
  | "SESSION_REJECTED"
  | "PARSE_FAILED"
  | "DATE_UNAVAILABLE";

export class ScrapeError extends Error {
  constructor(public code: ScrapeErrorCode, message: string) {
    super(message);
    this.name = "ScrapeError";
  }
}

export interface FacilityCell {
  players: string[];
  text: string;
  reserved: boolean;
}

/** `null` means the court is not offered at this time (no row for the combo). */
export interface FacilitySlot {
  time: string;
  cells: (FacilityCell | null)[];
}

export interface Facility {
  name: string;
  courts: string[];
  slots: FacilitySlot[];
}

export interface CourtSheet {
  /** YYYY-MM-DD in America/New_York */
  date: string;
  facilities: Facility[];
  /** ISO timestamp of when the sheet was scraped */
  fetchedAt: string;
}

/**
 * Club news/conditions parsed from the club-uploaded TNClub.htm document
 * (a Word-exported HTML file embedded in the welcome page iframe).
 */
export interface WelcomeInfo {
  /** First line of the document, e.g. "Sun City Hilton Head Tennis". */
  title: string;
  /**
   * Remaining paragraphs in order, as sanitized inline HTML: escaped text
   * plus vetted <a href> links only.
   */
  paragraphs: string[];
  fetchedAt: string; // ISO
}
