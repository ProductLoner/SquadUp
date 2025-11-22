import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, Minus, Dumbbell, Clock } from 'lucide-react';
import type { WorkoutSession, Log, Exercise } from '@/lib/db';
import { format } from 'date-fns';

interface SessionComparisonProps {
  session1: WorkoutSession;
  session2: WorkoutSession;
  logs1: Log[];
  logs2: Log[];
  exercises: Exercise[];
  onClose: () => void;
}

export function SessionComparison({
  session1,
  session2,
  logs1,
  logs2,
  exercises,
  onClose,
}: SessionComparisonProps) {
  const comparison = useMemo(() => {
    // Calculate session-level stats
    const stats1 = {
      totalVolume: logs1.reduce((sum, log) => sum + log.weight * log.reps, 0),
      totalSets: logs1.length,
      avgE1RM: logs1.reduce((sum, log) => sum + (log.e1rm || 0), 0) / logs1.length || 0,
      uniqueExercises: new Set(logs1.map(log => log.exercise_id)).size,
    };

    const stats2 = {
      totalVolume: logs2.reduce((sum, log) => sum + log.weight * log.reps, 0),
      totalSets: logs2.length,
      avgE1RM: logs2.reduce((sum, log) => sum + (log.e1rm || 0), 0) / logs2.length || 0,
      uniqueExercises: new Set(logs2.map(log => log.exercise_id)).size,
    };

    // Calculate deltas
    const volumeDelta = stats2.totalVolume - stats1.totalVolume;
    const volumeDeltaPercent = (volumeDelta / stats1.totalVolume) * 100;
    const e1rmDelta = stats2.avgE1RM - stats1.avgE1RM;
    const e1rmDeltaPercent = (e1rmDelta / stats1.avgE1RM) * 100;

    // Group logs by exercise
    const exerciseComparisons: Record<number, {
      exercise: Exercise;
      logs1: Log[];
      logs2: Log[];
    }> = {};

    const allExerciseIds = new Set([
      ...logs1.map(log => log.exercise_id),
      ...logs2.map(log => log.exercise_id),
    ]);

    allExerciseIds.forEach(exerciseId => {
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return;

      exerciseComparisons[exerciseId] = {
        exercise,
        logs1: logs1.filter(log => log.exercise_id === exerciseId),
        logs2: logs2.filter(log => log.exercise_id === exerciseId),
      };
    });

    return {
      stats1,
      stats2,
      volumeDelta,
      volumeDeltaPercent,
      e1rmDelta,
      e1rmDeltaPercent,
      exerciseComparisons,
    };
  }, [session1, session2, logs1, logs2, exercises]);

  const DeltaIndicator = ({ value, percent }: { value: number; percent: number }) => {
    if (Math.abs(value) < 0.01) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-4 h-4" />
          <span className="text-sm">No change</span>
        </div>
      );
    }

    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{value.toFixed(1)} ({isPositive ? '+' : ''}{percent.toFixed(1)}%)
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container max-w-6xl py-8">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Session Comparison</h2>
              <p className="text-muted-foreground">
                Compare performance metrics between two workout sessions
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Session Headers */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <h3 className="font-semibold text-lg mb-1">{session1.name}</h3>
              <p className="text-sm text-muted-foreground">
                {format(session1.scheduled_date, 'MMM d, yyyy')}
              </p>
              <Badge variant="outline" className="mt-2">Session 1 (Baseline)</Badge>
            </Card>

            <Card className="p-4 bg-green-500/10 border-green-500/20">
              <h3 className="font-semibold text-lg mb-1">{session2.name}</h3>
              <p className="text-sm text-muted-foreground">
                {format(session2.scheduled_date, 'MMM d, yyyy')}
              </p>
              <Badge variant="outline" className="mt-2">Session 2 (Comparison)</Badge>
            </Card>
          </div>

          {/* Overall Stats Comparison */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Overall Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Volume */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <span className="font-medium">Total Volume</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats1.totalVolume.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Session 1</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats2.totalVolume.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Session 2</p>
                  </div>
                </div>
                <DeltaIndicator 
                  value={comparison.volumeDelta} 
                  percent={comparison.volumeDeltaPercent} 
                />
              </Card>

              {/* Average e1RM */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-medium">Average e1RM</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats1.avgE1RM.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Session 1</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats2.avgE1RM.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Session 2</p>
                  </div>
                </div>
                <DeltaIndicator 
                  value={comparison.e1rmDelta} 
                  percent={comparison.e1rmDeltaPercent} 
                />
              </Card>

              {/* Total Sets */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">Total Sets</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats1.totalSets}</p>
                    <p className="text-xs text-muted-foreground">Session 1</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats2.totalSets}</p>
                    <p className="text-xs text-muted-foreground">Session 2</p>
                  </div>
                </div>
              </Card>

              {/* Exercises */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <span className="font-medium">Exercises</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats1.uniqueExercises}</p>
                    <p className="text-xs text-muted-foreground">Session 1</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparison.stats2.uniqueExercises}</p>
                    <p className="text-xs text-muted-foreground">Session 2</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Exercise-by-Exercise Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Exercise Breakdown</h3>
            <div className="space-y-3">
              {Object.values(comparison.exerciseComparisons).map(({ exercise, logs1, logs2 }) => {
                const volume1 = logs1.reduce((sum, log) => sum + log.weight * log.reps, 0);
                const volume2 = logs2.reduce((sum, log) => sum + log.weight * log.reps, 0);
                const avgE1RM1 = logs1.reduce((sum, log) => sum + (log.e1rm || 0), 0) / logs1.length || 0;
                const avgE1RM2 = logs2.reduce((sum, log) => sum + (log.e1rm || 0), 0) / logs2.length || 0;

                const volumeDelta = volume2 - volume1;
                const e1rmDelta = avgE1RM2 - avgE1RM1;

                return (
                  <Card key={exercise.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{exercise.name}</h4>
                        <Badge variant="outline" className="mt-1">{exercise.muscle_group}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Session 1 Volume</p>
                        <p className="font-semibold">{volume1.toFixed(0)} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Session 2 Volume</p>
                        <p className="font-semibold">{volume2.toFixed(0)} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Session 1 e1RM</p>
                        <p className="font-semibold">{avgE1RM1.toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Session 2 e1RM</p>
                        <p className="font-semibold">{avgE1RM2.toFixed(1)} kg</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Volume Change</p>
                        <DeltaIndicator 
                          value={volumeDelta} 
                          percent={(volumeDelta / volume1) * 100} 
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">e1RM Change</p>
                        <DeltaIndicator 
                          value={e1rmDelta} 
                          percent={(e1rmDelta / avgE1RM1) * 100} 
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Close Comparison</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
