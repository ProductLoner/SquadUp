import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2, Play, Edit2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkoutTemplates, useExercises, workoutTemplateOperations } from '@/hooks/useDatabase';
import { toast } from 'sonner';

export default function Templates() {
  const templates = useWorkoutTemplates();
  const exercises = useExercises();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    try {
      await workoutTemplateOperations.delete(id);
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
      console.error(error);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Workout Templates</h1>
              <p className="text-muted-foreground mt-1">
                Save and reuse workout configurations
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Workout Template</DialogTitle>
                  <DialogDescription>
                    Templates are best created from completed sessions. Use the "Save as Template" button in workout history.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Push Day A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Notes about this template..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    toast.info('Use "Save as Template" from completed workouts');
                    setIsCreateDialogOpen(false);
                  }}>
                    OK
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Template List */}
        {!templates || templates.length === 0 ? (
          <Card className="p-12 text-center">
            <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete a workout and save it as a template to get started
            </p>
            <Link href="/history">
              <Button variant="outline">View Workout History</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map(template => {
              const exerciseCount = template.exercises.length;
              const totalSets = template.exercises.reduce((sum, ex) => sum + ex.target_sets, 0);

              return (
                <Card key={template.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{exerciseCount} exercises</Badge>
                        <Badge variant="outline">{totalSets} total sets</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id!, template.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-2">
                    {template.exercises.map((ex, idx) => {
                      const exercise = exercises?.find(e => e.id === ex.exercise_id);
                      if (!exercise) return null;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-background rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium">{exercise.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {exercise.muscle_group}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {ex.target_sets} × {ex.target_reps_min}-{ex.target_reps_max} @ RIR {ex.target_rir}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
