import { TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProgressionRecommendation as ProgressionRec } from '@/lib/progression';

interface ProgressionRecommendationProps {
  recommendation: ProgressionRec;
  exerciseName: string;
  onAccept?: (newWeight: number) => void;
  onDismiss?: () => void;
}

export function ProgressionRecommendation({
  recommendation,
  exerciseName,
  onAccept,
  onDismiss,
}: ProgressionRecommendationProps) {
  const { shouldProgress, recommendedWeight, currentWeight, confidence, reason, increasePercent } = recommendation;

  const confidenceColor = {
    high: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  }[confidence];

  const Icon = shouldProgress ? TrendingUp : confidence === 'high' ? AlertCircle : Info;

  return (
    <Card className={`p-4 ${confidenceColor} border`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">
              {shouldProgress ? 'Weight Progression Recommended' : 'Performance Update'}
            </h4>
            <Badge variant="outline" className="capitalize">
              {confidence} confidence
            </Badge>
          </div>
          
          <p className="text-sm mb-3">{reason}</p>
          
          {shouldProgress && (
            <div className="space-y-2 mb-3">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="text-muted-foreground">Current weight:</span>
                <span className="font-semibold">{currentWeight} kg</span>
              </div>
              <div className="flex items-baseline gap-2 text-sm">
                <span className="text-muted-foreground">Recommended:</span>
                <span className="font-semibold text-lg">{recommendedWeight} kg</span>
                <Badge variant="secondary" className="text-xs">
                  +{increasePercent}%
                </Badge>
              </div>
            </div>
          )}
          
          {shouldProgress && onAccept && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(recommendedWeight)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply {recommendedWeight} kg
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
