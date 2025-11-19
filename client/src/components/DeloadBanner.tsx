import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { DeloadRecommendation } from '@/lib/deload';

interface DeloadBannerProps {
  recommendation: DeloadRecommendation;
  onDismiss?: () => void;
  onScheduleDeload?: () => void;
}

export function DeloadBanner({ recommendation, onDismiss, onScheduleDeload }: DeloadBannerProps) {
  if (!recommendation.needsDeload) return null;

  const getSeverityColor = () => {
    switch (recommendation.severity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/50 text-red-500';
      case 'moderate':
        return 'bg-orange-500/10 border-orange-500/50 text-orange-500';
      case 'mild':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  const getSeverityBadge = () => {
    const colors = {
      high: 'bg-red-500/20 text-red-500 border-red-500/30',
      moderate: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      mild: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      none: '',
    };

    return (
      <Badge variant="outline" className={colors[recommendation.severity]}>
        {recommendation.severity.toUpperCase()} FATIGUE
      </Badge>
    );
  };

  return (
    <Alert className={`relative ${getSeverityColor()}`}>
      <AlertTriangle className="h-5 w-5" />
      <AlertDescription>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">Deload Recommended</span>
              {getSeverityBadge()}
              <Badge variant="outline" className="text-xs">
                {recommendation.confidence} confidence
              </Badge>
            </div>
            
            <p className="text-sm mb-3">{recommendation.reason}</p>

            {recommendation.indicators.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-1">Fatigue Indicators:</p>
                <ul className="text-xs space-y-1">
                  {recommendation.indicators.map((indicator, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              {onScheduleDeload && (
                <Button
                  size="sm"
                  onClick={onScheduleDeload}
                  className="text-xs"
                >
                  Schedule Deload Week
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
