import { useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { ArrowLeft, Plus, Check, Timer } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useWorkoutSession,
  useSessionExercises,
  useLogs,
  useExercise,
  logOperations,
  workoutSessionOperations,
} from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RestTimer } from '@/components/RestTimer';
import { ExerciseAutoregulation } from '@/components/ExerciseAutoregulation';

export default function WorkoutSession() {
  const [, params] = useRoute('/workout/:id');
  const [, setLocation] = useLocation();
  const sessionId = params?.id ? parseInt(params.id) : undefined;
  
  const session = useWorkoutSession(sessionId);
  const sessionExercises = useSessionExercises(sessionId);
  const logs = useLogs(sessionId);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackExerciseId, setFeedbackExerciseId] = useState<number | null>(null);
  
  // Logging state
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('2');
  
  // Feedback state
  const [soreness, setSoreness] = useState('1');
  const [pump, setPump] = useState('3');
  const [jointPain, setJointPain] = useState('1');

  const currentSessionExercise = sessionExercises?.[currentExerciseIndex];
  const currentExerciseId = currentSessionExercise?.exercise_id;
  
  const currentExerciseLogs = logs?.filter(
    log => log.session_exercise_id === currentSessionExercise?.id
  ) || [];

  const handleLogSet = async () => {
    if (!currentSessionExercise || !sessionId || !currentExerciseId) return;
    
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const rirNum = parseInt(rir);

    if (isNaN(weightNum) || isNaN(repsNum) || isNaN(rirNum)) {
      toast.error('Please enter valid numbers');
      return;
    }

    try {
      await logOperations.create({
        session_exercise_id: currentSessionExercise.id!,
        session_id: sessionId,
        exercise_id: currentExerciseId,
        set_number: currentExerciseLogs.length + 1,
        weight: weightNum,
        reps: repsNum,
        rir: rirNum,
        target_rir: currentSessionExercise.target_rir,
        session_date: new Date(),
        created_at: new Date(),
      });
      
      toast.success(`Set ${currentExerciseLogs.length + 1} logged`);
      
      // Check if we've completed all target sets
      if (currentExerciseLogs.length + 1 >= currentSessionExercise.target_sets) {
        // Open feedback dialog
        setFeedbackExerciseId(currentExerciseId);
        setIsFeedbackDialogOpen(true);
      }
      
      // Clear weight and reps but keep RIR
      setWeight('');
      setReps('');
    } catch (error) {
      toast.error('Failed to log set');
      console.error(error);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedbackExerciseId || !sessionId) return;

    try {
      // Update the last log with feedback
      const lastLog = currentExerciseLogs[currentExerciseLogs.length - 1];
      if (lastLog) {
        await logOperations.update(lastLog.id!, {
          feedback_soreness: parseInt(soreness),
          feedback_pump: parseInt(pump),
          feedback_joint_pain: parseInt(jointPain),
        });
      }
      
      toast.success('Feedback saved');
      setIsFeedbackDialogOpen(false);
      setFeedbackExerciseId(null);
      
      // Move to next exercise if available
      if (sessionExercises && currentExerciseIndex < sessionExercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to save feedback');
      console.error(error);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionId) return;
    
    if (!confirm('Mark this session as complete?')) return;

    try {
      await workoutSessionOperations.complete(sessionId);
      toast.success('Session completed!');
      setLocation('/');
    } catch (error) {
      toast.error('Failed to complete session');
      console.error(error);
    }
  };

  if (!session || !sessionExercises) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (session.is_completed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Session Completed</h2>
            <p className="text-muted-foreground">
              {session.name} - {format(session.completed_date!, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{session.name}</h1>
              <p className="text-muted-foreground mt-1">
                {format(session.scheduled_date, 'EEEE, MMM d, yyyy')}
              </p>
            </div>
            
            <Button onClick={handleCompleteSession} variant="outline">
              <Check className="w-4 h-4 mr-2" />
              Complete Session
            </Button>
          </div>
        </div>

        {/* Exercise Progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {sessionExercises.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full ${
                  idx < currentExerciseIndex
                    ? 'bg-green-500'
                    : idx === currentExerciseIndex
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {sessionExercises.length}
          </p>
        </div>

        {/* Current Exercise */}
        {currentSessionExercise && (
          <CurrentExerciseCard
            sessionExercise={currentSessionExercise}
            logs={currentExerciseLogs}
            weight={weight}
            setWeight={setWeight}
            reps={reps}
            setReps={setReps}
            rir={rir}
            setRir={setRir}
            onLogSet={handleLogSet}
          />
        )}

        {/* Exercise Navigation */}
        {sessionExercises.length > 1 && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              disabled={currentExerciseIndex === 0}
              onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            >
              Previous Exercise
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={currentExerciseIndex === sessionExercises.length - 1}
              onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            >
              Next Exercise
            </Button>
          </div>
        )}

        {/* Rest Timer */}
        <div className="mt-6">
          <RestTimer defaultDuration={120} />
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Feedback</DialogTitle>
            <DialogDescription>
              How did this exercise feel?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Muscle Soreness (1-5)</Label>
              <Select value={soreness} onValueChange={setSoreness}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - None</SelectItem>
                  <SelectItem value="2">2 - Mild</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Sore</SelectItem>
                  <SelectItem value="5">5 - Very Sore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Pump Quality (1-5)</Label>
              <Select value={pump} onValueChange={setPump}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - None</SelectItem>
                  <SelectItem value="2">2 - Slight</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="5">5 - Great</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Joint Pain (1-5)</Label>
              <Select value={jointPain} onValueChange={setJointPain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - None</SelectItem>
                  <SelectItem value="2">2 - Slight</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Uncomfortable</SelectItem>
                  <SelectItem value="5">5 - Painful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Skip
            </Button>
            <Button onClick={handleSaveFeedback}>Save Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurrentExerciseCard({
  sessionExercise,
  logs,
  weight,
  setWeight,
  reps,
  setReps,
  rir,
  setRir,
  onLogSet,
}: any) {
  const exercise = useExercise(sessionExercise.exercise_id);

  if (!exercise) return null;

  const setsCompleted = logs.length;
  const setsRemaining = sessionExercise.target_sets - setsCompleted;

  return (
    <div className="p-6 bg-card border-2 border-primary rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{exercise.name}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{exercise.muscle_group}</Badge>
          <Badge variant="outline">
            {setsCompleted} / {sessionExercise.target_sets} sets
          </Badge>
        </div>
      </div>

      {/* Autoregulation Recommendation */}
      <ExerciseAutoregulation
        exercise={exercise}
        sessionExercise={sessionExercise}
      />

      {/* Target Info */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-background rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Target Reps</p>
          <p className="text-lg font-semibold">
            {sessionExercise.target_reps_min}-{sessionExercise.target_reps_max}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Target RIR</p>
          <p className="text-lg font-semibold">{sessionExercise.target_rir}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Sets Remaining</p>
          <p className="text-lg font-semibold">{setsRemaining}</p>
        </div>
      </div>

      {/* Previous Sets */}
      {logs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Previous Sets</h3>
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg"
              >
                <span className="text-sm font-medium">Set {log.set_number}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span>{log.weight} kg × {log.reps} reps</span>
                  <Badge variant="outline">RIR {log.rir}</Badge>
                  {log.e1rm && (
                    <span className="text-muted-foreground">e1RM: {log.e1rm.toFixed(1)} kg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log New Set */}
      {setsRemaining > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Log Set {setsCompleted + 1}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rir">RIR</Label>
              <Select value={rir} onValueChange={setRir}>
                <SelectTrigger id="rir">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Failure</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={onLogSet} className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Log Set
          </Button>
        </div>
      )}

      {setsRemaining === 0 && (
        <div className="text-center py-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="font-semibold text-green-500">All sets completed!</p>
        </div>
      )}
    </div>
  );
}
