import { RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Exercise } from '@/lib/db';

interface ExerciseRotationProps {
  exerciseName: string;
  weeksUsed: number;
  shouldRotate: boolean;
  urgency: 'high' | 'medium' | 'low';
  message: string;
  alternatives: Exercise[];
  onSelectAlternative?: (exercise: Exercise) => void;
}

export function ExerciseRotation({
  exerciseName,
  weeksUsed,
  shouldRotate,
  urgency,
  message,
  alternatives,
  onSelectAlternative,
}: ExerciseRotationProps) {
  const urgencyConfig = {
    high: {
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
      badge: 'Urgent',
    },
    medium: {
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      icon: RefreshCw,
      badge: 'Recommended',
    },
    low: {
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      icon: Info,
      badge: 'Info',
    },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  if (!shouldRotate) {
    return null; // Don't show if rotation not needed
  }

  return (
    <Card className={`p-4 ${config.color} border`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">Exercise Rotation Recommended</h4>
            <Badge variant="outline" className="capitalize">
              {config.badge}
            </Badge>
          </div>
          
          <p className="text-sm mb-3">{message}</p>
          
          {alternatives.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested Alternatives:</p>
              <div className="space-y-2">
                {alternatives.slice(0, 3).map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">{exercise.muscle_group}</p>
                    </div>
                    {onSelectAlternative && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectAlternative(exercise)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Swap
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
