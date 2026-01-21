/**
 * Pure utility functions for analytics and scoring.
 * No database or external service dependencies.
 */

export function calculateWeeklySummary(dailyScores: number[]): {
  weeklyScore: number;
  trend: 'improving' | 'declining' | 'stable';
  delta: number;
} {
  if (dailyScores.length === 0) {
    return { weeklyScore: 0, trend: 'stable', delta: 0 };
  }

  // Calculate average
  const weeklyScore = Math.round(
    dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length
  );

  // Determine trend (compare first half vs second half)
  if (dailyScores.length >= 4) {
    const midpoint = Math.floor(dailyScores.length / 2);
    const firstHalf = dailyScores.slice(0, midpoint);
    const secondHalf = dailyScores.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    
    const delta = Math.round(secondAvg - firstAvg);
    
    if (delta > 3) {
      return { weeklyScore, trend: 'improving', delta };
    } else if (delta < -3) {
      return { weeklyScore, trend: 'declining', delta };
    }
  }

  return { weeklyScore, trend: 'stable', delta: 0 };
}
