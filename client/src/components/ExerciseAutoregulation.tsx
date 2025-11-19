import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Exercise, SessionExercise } from '@/lib/db';
import { useLogs } from '@/hooks/useDatabase';
import { getExerciseSetRecommendation } from '@/lib/autoregulation';
import { subDays } from 'date-fns';

interface ExerciseAutoregulationProps {
  exercise: Exercise;
  sessionExercise: SessionExercise;
  onApplyRecommendation?: (newSets: number) => void;
}

export function ExerciseAutoregulation({
  exercise,
  sessionExercise,
  onApplyRecommendation,
}: ExerciseAutoregulationProps) {
  const allLogs = useLogs() || [];
  const [isExpanded, setIsExpanded] = useState(false);

  // Get recent logs for this exercise (last 14 days)
  const recentLogs = useMemo(() => {
    const cutoffDate = subDays(new Date(), 14);
    return allLogs.filter(
      log => log.exercise_id === exercise.id && log.session_date >= cutoffDate
    );
  }, [allLogs, exercise.id]);

  const recommendation = useMemo(() => {
    if (recentLogs.length < 2) return null;
    return getExerciseSetRecommendation(
      exercise.id!,
      sessionExercise.target_sets,
      recentLogs
    );
  }, [exercise.id, sessionExercise.target_sets, recentLogs]);

  if (!recommendation || recommendation.change === 0) {
    return null; // No recommendation needed
  }

  const getChangeIcon = () => {
    if (recommendation.change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (recommendation.change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getChangeColor = () => {
    if (recommendation.change > 0) return 'text-green-500';
    if (recommendation.change < 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getConfidenceBadge = () => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    } as const;

    return (
      <Badge variant={variants[recommendation.confidence]} className="text-xs">
        {recommendation.confidence}
      </Badge>
    );
  };

  return (
    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          {getChangeIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                Recommended: {recommendation.recommendedSets} sets
              </span>
              <span className={`text-sm font-semibold ${getChangeColor()}`}>
                ({recommendation.change > 0 ? '+' : ''}{recommendation.change})
              </span>
              {getConfidenceBadge()}
            </div>
            
            {isExpanded && (
              <p className="text-xs text-muted-foreground mt-2">
                {recommendation.reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onApplyRecommendation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyRecommendation(recommendation.recommendedSets)}
              className="text-xs"
            >
              Apply
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
