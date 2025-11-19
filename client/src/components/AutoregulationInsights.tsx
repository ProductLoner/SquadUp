import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Log, Exercise } from '@/lib/db';
import { getExerciseSetRecommendation, calculatePerformanceMetrics } from '@/lib/autoregulation';

interface AutoregulationInsightsProps {
  exercise: Exercise;
  currentSets: number;
  recentLogs: Log[];
  weeksSinceLastIncrease?: number;
}

export function AutoregulationInsights({
  exercise,
  currentSets,
  recentLogs,
  weeksSinceLastIncrease = 0,
}: AutoregulationInsightsProps) {
  const recommendation = useMemo(() => {
    return getExerciseSetRecommendation(
      exercise.id!,
      currentSets,
      recentLogs,
      weeksSinceLastIncrease
    );
  }, [exercise.id, currentSets, recentLogs, weeksSinceLastIncrease]);

  const metrics = useMemo(() => {
    const exerciseLogs = recentLogs.filter(log => log.exercise_id === exercise.id);
    return calculatePerformanceMetrics(exerciseLogs);
  }, [recentLogs, exercise.id]);

  if (!recommendation || !metrics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Not enough data to generate recommendations. Complete at least 2 workout sessions.
        </AlertDescription>
      </Alert>
    );
  }

  const getChangeIcon = () => {
    if (recommendation.change > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (recommendation.change < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-yellow-500" />;
  };

  const getConfidenceBadge = () => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    } as const;

    return (
      <Badge variant={variants[recommendation.confidence]}>
        {recommendation.confidence} confidence
      </Badge>
    );
  };

  const getChangeColor = () => {
    if (recommendation.change > 0) return 'text-green-500';
    if (recommendation.change < 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Set Recommendation</h3>
          <p className="text-sm text-muted-foreground">
            Based on {metrics.sessionsAnalyzed} recent session{metrics.sessionsAnalyzed !== 1 ? 's' : ''}
          </p>
        </div>
        {getConfidenceBadge()}
      </div>

      <div className="flex items-center gap-4 mb-4">
        {getChangeIcon()}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{recommendation.recommendedSets}</span>
            <span className="text-muted-foreground">sets</span>
            {recommendation.change !== 0 && (
              <span className={`text-lg font-semibold ${getChangeColor()}`}>
                ({recommendation.change > 0 ? '+' : ''}{recommendation.change})
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Current: {recommendation.currentSets} sets
          </p>
        </div>
      </div>

      <Alert className="mb-4">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>{recommendation.reason}</AlertDescription>
      </Alert>

      {/* Performance Metrics */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="text-sm font-semibold">Performance Metrics</h4>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Avg RIR</p>
            <p className="font-medium">
              {metrics.avgRIR.toFixed(1)} 
              <span className="text-xs text-muted-foreground ml-1">
                (target: {metrics.targetRIR.toFixed(1)})
              </span>
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">RIR Deviation</p>
            <p className={`font-medium ${
              Math.abs(metrics.rirDeviation) <= 0.5 ? 'text-green-500' :
              Math.abs(metrics.rirDeviation) <= 1.0 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {metrics.rirDeviation > 0 ? '+' : ''}{metrics.rirDeviation.toFixed(1)}
            </p>
          </div>

          {metrics.avgSoreness > 0 && (
            <div>
              <p className="text-muted-foreground">Avg Soreness</p>
              <p className={`font-medium ${
                metrics.avgSoreness <= 2 ? 'text-green-500' :
                metrics.avgSoreness <= 3 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.avgSoreness.toFixed(1)}/5
              </p>
            </div>
          )}

          {metrics.avgPump > 0 && (
            <div>
              <p className="text-muted-foreground">Avg Pump</p>
              <p className={`font-medium ${
                metrics.avgPump >= 4 ? 'text-green-500' :
                metrics.avgPump >= 3 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.avgPump.toFixed(1)}/5
              </p>
            </div>
          )}

          {metrics.avgJointPain > 0 && (
            <div>
              <p className="text-muted-foreground">Avg Joint Pain</p>
              <p className={`font-medium ${
                metrics.avgJointPain <= 1 ? 'text-green-500' :
                metrics.avgJointPain <= 2 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.avgJointPain.toFixed(1)}/5
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
