import { useState } from 'react';
import { Calendar, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Microcycle, SessionExercise, Exercise } from '@/lib/db';
import { generateDeloadWeek, type DeloadWeekPlan } from '@/lib/deloadGenerator';
import { format } from 'date-fns';

interface DeloadWeekGeneratorProps {
  microcycle: Microcycle;
  sessionExercises: SessionExercise[];
  exercises: Exercise[];
  onGenerate: (deloadPlan: DeloadWeekPlan) => Promise<void>;
}

export function DeloadWeekGenerator({
  microcycle,
  sessionExercises,
  exercises,
  onGenerate,
}: DeloadWeekGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const deloadPlan = generateDeloadWeek(microcycle, sessionExercises);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(deloadPlan);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate deload week:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <TrendingDown className="w-4 h-4 mr-2" />
        Generate Deload Week
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              Deload Week Generator
            </DialogTitle>
            <DialogDescription>
              Automatically create a recovery week with 50% volume reduction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Deload Week Info */}
            <Card className="p-4 bg-orange-500/10 border-orange-500/20">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Deload Week Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    {deloadPlan.deloadMicrocycle.start_date && 
                      format(deloadPlan.deloadMicrocycle.start_date, 'MMM d, yyyy')} - {' '}
                    {deloadPlan.deloadMicrocycle.end_date && 
                      format(deloadPlan.deloadMicrocycle.end_date, 'MMM d, yyyy')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Week {deloadPlan.deloadMicrocycle.week_number}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Volume Reduction Summary */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Volume Reduction</h4>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Total Volume Reduction</span>
                <Badge variant="default" className="text-lg">
                  -{deloadPlan.totalVolumeReduction.toFixed(0)}%
                </Badge>
              </div>
            </Card>

            {/* Exercise Adjustments */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Exercise Adjustments</h4>
              <div className="space-y-2">
                {deloadPlan.exerciseAdjustments.map((adj) => {
                  const exercise = exercises.find(e => e.id === adj.exerciseId);
                  if (!exercise) return null;

                  return (
                    <div
                      key={adj.exerciseId}
                      className="flex items-center justify-between p-3 bg-background border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.muscle_group}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {adj.originalSets} → {adj.deloadSets} sets
                          </p>
                          <p className="text-xs text-muted-foreground">
                            -{adj.reduction.toFixed(0)}% volume
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Deload Guidelines */}
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Deload Week Guidelines
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Maintain the same weight and rep ranges</li>
                <li>Focus on technique and mind-muscle connection</li>
                <li>Sets are reduced by ~50% for recovery</li>
                <li>Use this week to address any minor aches</li>
                <li>Return to normal volume the following week</li>
              </ul>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Create Deload Week'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
