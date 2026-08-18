/**
 * Returns the Tuesday that starts NFL Week 1 for a given year.
 * The NFL regular season always opens on the first Thursday on or after Sep 5,
 * and DraftKings slates open the Tuesday two days before that.
 */
function week1Tuesday(year: number): Date {
  const sep5 = new Date(year, 8, 5); // September 5 (month is 0-indexed)
  const dow = sep5.getDay();          // 0=Sun … 4=Thu
  const daysToThursday = (4 - dow + 7) % 7;
  const thursday = new Date(year, 8, 5 + daysToThursday);
  return new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate() - 2);
}

export type NFLWeekInfo = { week: number; season: number };

export function getCurrentNFLWeek(): NFLWeekInfo {
  const today = new Date();
  const year  = today.getFullYear();

  // If we're before the Super Bowl window (~mid-Feb) treat it as the prior season's playoffs
  const midFeb = new Date(year, 1, 15);
  if (today < midFeb) {
    return { week: 18, season: year - 1 };
  }

  const seasonStart = week1Tuesday(year);

  if (today < seasonStart) {
    // Preseason — default to Week 1 of the upcoming season
    return { week: 1, season: year };
  }

  const daysDiff = Math.floor(
    (today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const week = Math.min(18, Math.max(1, Math.floor(daysDiff / 7) + 1));
  return { week, season: year };
}
