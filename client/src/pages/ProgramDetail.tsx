import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Plus, Calendar, Dumbbell, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  useMesocycle,
  useMicrocycles,
  useWorkoutSessions,
  useExercises,
  useWorkoutTemplates,
  microcycleOperations,
  workoutSessionOperations,
  sessionExerciseOperations,
  workoutTemplateOperations,
} from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function ProgramDetail() {
  const [, params] = useRoute('/programs/:id');
  const mesocycleId = params?.id ? parseInt(params.id) : undefined;
  
  const mesocycle = useMesocycle(mesocycleId);
  const microcycles = useMicrocycles(mesocycleId);
  const exercises = useExercises();
  const templates = useWorkoutTemplates();
  
  const [isAddMicroDialogOpen, setIsAddMicroDialogOpen] = useState(false);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [selectedMicrocycleId, setSelectedMicrocycleId] = useState<number | undefined>();
  
  // Session form state
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();

  const handleGenerateMicrocycles = async () => {
    if (!mesocycle) return;

    const startDate = new Date(mesocycle.start_date);
    const endDate = new Date(mesocycle.end_date);
    const weeksDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    try {
      for (let week = 0; week < weeksDiff; week++) {
        const weekStart = addDays(startDate, week * 7);
        const weekEnd = addDays(weekStart, 6);
        
        await microcycleOperations.create({
          mesocycle_id: mesocycle.id!,
          week_number: week + 1,
          start_date: weekStart,
          end_date: weekEnd,
          created_at: new Date(),
        });
      }
      
      toast.success(`Generated ${weeksDiff} microcycles`);
      setIsAddMicroDialogOpen(false);
    } catch (error) {
      toast.error('Failed to generate microcycles');
      console.error(error);
    }
  };

  const handleAddSession = async () => {
    if (!selectedMicrocycleId || !sessionName.trim() || !sessionDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const sessionId = await workoutSessionOperations.create({
        microcycle_id: selectedMicrocycleId,
        name: sessionName.trim(),
        scheduled_date: new Date(sessionDate),
        is_completed: false,
        created_at: new Date(),
      });

      // Apply template if selected
      if (selectedTemplateId) {
        await workoutTemplateOperations.applyToSession(selectedTemplateId, sessionId as number);
        toast.success('Workout session created from template');
      } else {
        // Add manually selected exercises to the session
        for (let i = 0; i < selectedExercises.length; i++) {
          await sessionExerciseOperations.create({
            session_id: sessionId as number,
            exercise_id: selectedExercises[i],
            order_index: i,
            target_sets: 3,
            target_reps_min: 8,
            target_reps_max: 12,
            target_rir: 2,
            created_at: new Date(),
          });
        }
        toast.success('Workout session created');
      }
      
      resetSessionForm();
      setIsAddSessionDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create session');
      console.error(error);
    }
  };

  const resetSessionForm = () => {
    setSessionName('');
    setSessionDate('');
    setSelectedExercises([]);
    setSelectedTemplateId(undefined);
  };

  const handleTemplateSelect = (templateId: number | undefined) => {
    setSelectedTemplateId(templateId);
    setSelectedExercises([]); // Clear manual selection when template is chosen
  };

  const toggleExercise = (exerciseId: number) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  if (!mesocycle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/programs">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{mesocycle.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{mesocycle.phase_type}</Badge>
                {mesocycle.is_active && <Badge>Active</Badge>}
              </div>
              <p className="text-muted-foreground mt-2">
                {format(mesocycle.start_date, 'MMM d, yyyy')} - {format(mesocycle.end_date, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Microcycles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Microcycles (Weeks)</h2>
            {(!microcycles || microcycles.length === 0) && (
              <Dialog open={isAddMicroDialogOpen} onOpenChange={setIsAddMicroDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Microcycles
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Microcycles</DialogTitle>
                    <DialogDescription>
                      This will automatically create weekly microcycles for the entire mesocycle duration
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMicroDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateMicrocycles}>Generate</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!microcycles || microcycles.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No microcycles yet. Generate them to start planning workouts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {microcycles.map(micro => (
                <MicrocycleCard
                  key={micro.id}
                  microcycle={micro}
                  onAddSession={(microId) => {
                    setSelectedMicrocycleId(microId);
                    setIsAddSessionDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Session Dialog */}
      <Dialog open={isAddSessionDialogOpen} onOpenChange={(open) => {
        setIsAddSessionDialogOpen(open);
        if (!open) resetSessionForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Workout Session</DialogTitle>
            <DialogDescription>
              Add a new workout session to this microcycle
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Upper A"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-date">Scheduled Date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
            </div>
            
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Use Template (Optional)</Label>
              <Select
                value={selectedTemplateId?.toString()}
                onValueChange={(value) => handleTemplateSelect(value === 'none' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or choose exercises manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Template (Manual Selection)</SelectItem>
                  {templates?.map(template => (
                    <SelectItem key={template.id} value={template.id!.toString()}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {template.name} ({template.exercises.length} exercises)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <p className="text-xs text-green-500">
                  Template selected. Exercises will be added automatically.
                </p>
              )}
            </div>

            {/* Manual Exercise Selection */}
            {!selectedTemplateId && (
            <div className="space-y-2">
                <Label>Select Exercises</Label>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                {exercises?.map(exercise => (
                  <div
                    key={exercise.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExercises.includes(exercise.id!)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-accent/50'
                    }`}
                    onClick={() => toggleExercise(exercise.id!)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{exercise.name}</span>
                      <Badge variant="outline">{exercise.muscle_group}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedExercises.length} exercise(s) selected
              </p>
            </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSession}>Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MicrocycleCard({
  microcycle,
  onAddSession,
}: {
  microcycle: any;
  onAddSession: (microcycleId: number) => void;
}) {
  const sessions = useWorkoutSessions(microcycle.id);

  return (
    <div className="p-5 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Week {microcycle.week_number}</h3>
          <p className="text-sm text-muted-foreground">
            {format(microcycle.start_date, 'MMM d')} - {format(microcycle.end_date, 'MMM d, yyyy')}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddSession(microcycle.id)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map(session => (
            <Link key={session.id} href={`/workout/${session.id}`}>
              <div className="p-3 bg-background border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(session.scheduled_date, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {session.is_completed && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No sessions scheduled
        </p>
      )}
    </div>
  );
}
