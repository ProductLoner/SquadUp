import { describe, it, expect } from 'vitest';
import { calculatePerformanceMetrics, generateSetRecommendation } from './autoregulation';
import type { Log } from './db';

describe('Autoregulation Logic', () => {
  describe('calculatePerformanceMetrics', () => {
    it('should calculate correct averages from logs', () => {
      const logs: Partial<Log>[] = [
        {
          exercise_id: 1,
          rir: 2,
          target_rir: 2,
          feedback_soreness: 3,
          feedback_pump: 4,
          feedback_joint_pain: 1,
        },
        {
          exercise_id: 1,
          rir: 1,
          target_rir: 2,
          feedback_soreness: 2,
          feedback_pump: 5,
          feedback_joint_pain: 0,
        },
        {
          exercise_id: 1,
          rir: 3,
          target_rir: 2,
          feedback_soreness: 4,
          feedback_pump: 3,
          feedback_joint_pain: 2,
        },
      ];

      const metrics = calculatePerformanceMetrics(logs as Log[]);

      expect(metrics).not.toBeNull();
      expect(metrics!.avgRIR).toBe(2);
      expect(metrics!.targetRIR).toBe(2);
      expect(metrics!.rirDeviation).toBe(0);
      expect(metrics!.avgSoreness).toBe(3);
      expect(metrics!.avgPump).toBe(4);
      expect(metrics!.avgJointPain).toBe(1);
      expect(metrics!.sessionsAnalyzed).toBe(3);
    });

    it('should return null for empty logs', () => {
      const metrics = calculatePerformanceMetrics([]);
      expect(metrics).toBeNull();
    });
  });

  describe('generateSetRecommendation', () => {
    it('should recommend adding sets when RIR is consistently low with good recovery', () => {
      const metrics = {
        avgRIR: 0.5,
        targetRIR: 2,
        rirDeviation: -1.5,
        avgSoreness: 2,
        avgPump: 4,
        avgJointPain: 1,
        sessionsAnalyzed: 3,
      };

      const recommendation = generateSetRecommendation(3, metrics);

      expect(recommendation.recommendedSets).toBe(4);
      expect(recommendation.change).toBe(1);
      expect(recommendation.confidence).toBe('high');
    });

    it('should maintain sets when performance is stable', () => {
      const metrics = {
        avgRIR: 2,
        targetRIR: 2,
        rirDeviation: 0,
        avgSoreness: 2,
        avgPump: 3,
        avgJointPain: 1,
        sessionsAnalyzed: 3,
      };

      const recommendation = generateSetRecommendation(3, metrics);

      expect(recommendation.recommendedSets).toBe(3);
      expect(recommendation.change).toBe(0);
    });

    it('should reduce sets when joint pain is high', () => {
      const metrics = {
        avgRIR: 2,
        targetRIR: 2,
        rirDeviation: 0,
        avgSoreness: 3,
        avgPump: 3,
        avgJointPain: 4,
        sessionsAnalyzed: 3,
      };

      const recommendation = generateSetRecommendation(3, metrics);

      expect(recommendation.recommendedSets).toBe(2);
      expect(recommendation.change).toBe(-1);
      expect(recommendation.confidence).toBe('high');
    });

    it('should maintain sets when soreness is high', () => {
      const metrics = {
        avgRIR: 2,
        targetRIR: 2,
        rirDeviation: 0,
        avgSoreness: 4,
        avgPump: 3,
        avgJointPain: 2,
        sessionsAnalyzed: 3,
      };

      const recommendation = generateSetRecommendation(3, metrics);

      expect(recommendation.recommendedSets).toBe(3);
      expect(recommendation.change).toBe(0);
    });

    it('should not recommend more than +2 sets at once', () => {
      const metrics = {
        avgRIR: 0,
        targetRIR: 3,
        rirDeviation: -3,
        avgSoreness: 1,
        avgPump: 5,
        avgJointPain: 0,
        sessionsAnalyzed: 5,
      };

      const recommendation = generateSetRecommendation(2, metrics);

      expect(recommendation.recommendedSets).toBeLessThanOrEqual(4);
    });

    it('should not go below 1 set', () => {
      const metrics = {
        avgRIR: 4,
        targetRIR: 2,
        rirDeviation: 2,
        avgSoreness: 5,
        avgPump: 1,
        avgJointPain: 5,
        sessionsAnalyzed: 3,
      };

      const recommendation = generateSetRecommendation(1, metrics);

      expect(recommendation.recommendedSets).toBeGreaterThanOrEqual(1);
    });

    it('should recommend increase after 3 weeks of stability', () => {
      const metrics = {
        avgRIR: 2,
        targetRIR: 2,
        rirDeviation: 0,
        avgSoreness: 2,
        avgPump: 3,
        avgJointPain: 1,
        sessionsAnalyzed: 6,
      };

      const recommendation = generateSetRecommendation(3, metrics, 3);

      expect(recommendation.recommendedSets).toBe(4);
      expect(recommendation.change).toBe(1);
    });

    it('should return low confidence for insufficient data', () => {
      const metrics = {
        avgRIR: 2,
        targetRIR: 2,
        rirDeviation: 0,
        avgSoreness: 2,
        avgPump: 3,
        avgJointPain: 1,
        sessionsAnalyzed: 1,
      };

      const recommendation = generateSetRecommendation(3, metrics);

      expect(recommendation.confidence).toBe('low');
      expect(recommendation.change).toBe(0);
    });
  });
});
