import { AlertTriangle, Activity, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InjuryRisk } from '@/lib/injuryPrevention';
import type { Exercise } from '@/lib/db';

interface InjuryPreventionAlertProps {
  risk: InjuryRisk;
  alternatives?: Exercise[];
  onSelectAlternative?: (exercise: Exercise) => void;
}

export function InjuryPreventionAlert({
  risk,
  alternatives = [],
  onSelectAlternative,
}: InjuryPreventionAlertProps) {
  const riskConfig = {
    high: {
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
      badge: 'High Risk',
      badgeVariant: 'destructive' as const,
    },
    medium: {
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      icon: Activity,
      badge: 'Medium Risk',
      badgeVariant: 'secondary' as const,
    },
    low: {
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      icon: Info,
      badge: 'Low Risk',
      badgeVariant: 'outline' as const,
    },
  };

  const config = riskConfig[risk.riskLevel];
  const Icon = config.icon;

  return (
    <Card className={`p-4 ${config.color} border`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">Injury Risk Detected</h4>
            <Badge variant={config.badgeVariant}>
              {config.badge}
            </Badge>
          </div>
          
          <div className="mb-3">
            <p className="font-medium text-sm mb-1">{risk.exerciseName}</p>
            <p className="text-sm text-muted-foreground">
              Average joint pain: {risk.avgJointPain.toFixed(1)}/5 over last {risk.recentSessions} sessions
            </p>
          </div>
          
          <p className="text-sm mb-3">{risk.recommendation}</p>
          
          {alternatives.length > 0 && risk.riskLevel !== 'low' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lower-Stress Alternatives:</p>
              <div className="space-y-2">
                {alternatives.map((exercise) => (
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
                        Switch
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
