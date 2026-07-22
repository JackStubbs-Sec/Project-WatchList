// JustWatch/TMDB provider-data indexing lag can run past a week for a brand-new
// release, so this window is wider than a literal "just released" reading.
export const JUST_RELEASED_WINDOW_DAYS = 14;

export function isJustReleased(releaseDate: string | undefined, windowDays: number = JUST_RELEASED_WINDOW_DAYS): boolean {
  if (!releaseDate) return false;
  const released = new Date(releaseDate).getTime();
  if (Number.isNaN(released)) return false;

  const deltaDays = (Date.now() - released) / 86400000;
  return deltaDays >= 0 && deltaDays <= windowDays;
}
