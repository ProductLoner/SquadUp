import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Calendar, Dumbbell, TrendingUp, Clock, Filter, Save, GitCompare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkoutSessions, useLogs, useExercises, workoutTemplateOperations } from '@/hooks/useDatabase';
import { db } from '@/lib/db';
import type { WorkoutSession, Log, Exercise } from '@/lib/db';
import { format, isAfter, subDays, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { SessionComparison } from '@/components/SessionComparison';

export default function History() {
  const allSessions = useWorkoutSessions();
  const allLogs = useLogs() || [];
  const exercises = useExercises() || [];
  
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Filter completed sessions
  const completedSessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter(session => session.is_completed);
  }, [allSessions]);

  // Apply date filter
  const dateFilteredSessions = useMemo(() => {
    if (dateFilter === 'all') return completedSessions;

    const now = new Date();
    let cutoffDate: Date;

    switch (dateFilter) {
      case 'week':
        cutoffDate = subDays(now, 7);
        break;
      case 'month':
        cutoffDate = subMonths(now, 1);
        break;
      case '3months':
        cutoffDate = subMonths(now, 3);
        break;
      default:
        return completedSessions;
    }

    return completedSessions.filter(session =>
      isAfter(session.scheduled_date, cutoffDate)
    );
  }, [completedSessions, dateFilter]);

  // Apply search and muscle group filters
  const filteredSessions = useMemo(() => {
    let filtered = dateFilteredSessions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        // Check session name
        if (session.name.toLowerCase().includes(query)) return true;

        // Check exercises in session
        const sessionLogs = allLogs.filter(log => log.session_id === session.id);
        const sessionExerciseIds = new Set(sessionLogs.map(log => log.exercise_id));
        const sessionExercises = exercises.filter(ex => sessionExerciseIds.has(ex.id!));
        
        return sessionExercises.some(ex => ex.name.toLowerCase().includes(query));
      });
    }

    // Muscle group filter
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(session => {
        const sessionLogs = allLogs.filter(log => log.session_id === session.id);
        const sessionExerciseIds = new Set(sessionLogs.map(log => log.exercise_id));
        const sessionExercises = exercises.filter(ex => sessionExerciseIds.has(ex.id!));
        
        return sessionExercises.some(ex => ex.muscle_group === selectedMuscleGroup);
      });
    }

    return filtered.sort((a, b) => b.scheduled_date.getTime() - a.scheduled_date.getTime());
  }, [dateFilteredSessions, searchQuery, selectedMuscleGroup, allLogs, exercises]);

  // Calculate session stats
  const getSessionStats = (session: WorkoutSession) => {
    const sessionLogs = allLogs.filter(log => log.session_id === session.id);
    
    const totalSets = sessionLogs.length;
    const totalVolume = sessionLogs.reduce((sum, log) => sum + (log.weight * log.reps), 0);
    const uniqueExercises = new Set(sessionLogs.map(log => log.exercise_id)).size;
    
    const duration = session.completed_date && session.scheduled_date
      ? Math.round((session.completed_date.getTime() - session.scheduled_date.getTime()) / (1000 * 60))
      : 0;
    
    return {
      totalSets,
      totalVolume: totalVolume.toFixed(0),
      uniqueExercises,
      duration,
    };
  };

  const muscleGroups = useMemo(() => {
    return Array.from(new Set(exercises.map(ex => ex.muscle_group))).sort();
  }, [exercises]);

  const toggleComparisonSelection = (sessionId: number) => {
    setSelectedForComparison(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      }
      if (prev.length >= 2) {
        toast.error('You can only compare 2 sessions at a time');
        return prev;
      }
      return [...prev, sessionId];
    });
  };

  const handleCompare = () => {
    if (selectedForComparison.length !== 2) {
      toast.error('Please select exactly 2 sessions to compare');
      return;
    }
    setShowComparison(true);
  };

  const handleSaveAsTemplate = async (sessionId: number) => {
    try {
      const session = allSessions?.find(s => s.id === sessionId);
      if (!session) {
        toast.error('Session not found');
        return;
      }

      // Get session exercises
      const sessionExercises = await db.session_exercises
        .where('session_id')
        .equals(sessionId)
        .sortBy('order_index');
      
      if (!sessionExercises || sessionExercises.length === 0) {
        toast.error('No exercises found in this session');
        return;
      }

      // Create template from session
      const templateExercises = sessionExercises.map(se => ({
        exercise_id: se.exercise_id,
        order_index: se.order_index,
        target_sets: se.target_sets,
        target_reps_min: se.target_reps_min,
        target_reps_max: se.target_reps_max,
        target_rir: se.target_rir,
      }));

      await workoutTemplateOperations.create({
        name: `${session.name} Template`,
        description: `Created from session on ${format(session.scheduled_date, 'MMM d, yyyy')}`,
        exercises: templateExercises,
        created_at: new Date(),
      });

      toast.success('Template saved successfully!');
    } catch (error) {
      toast.error('Failed to save template');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Workout History</h1>
              <p className="text-muted-foreground mt-1">
                {filteredSessions.length} completed session{filteredSessions.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {selectedForComparison.length > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-base px-4 py-2">
                  {selectedForComparison.length} selected
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => setSelectedForComparison([])}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleCompare}
                  disabled={selectedForComparison.length !== 2}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Sessions
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Muscle Group</label>
              <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Muscle Groups</SelectItem>
                  {muscleGroups.map(group => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search sessions or exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Session Timeline */}
        {filteredSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
            <p className="text-muted-foreground">
              {completedSessions.length === 0
                ? 'Complete some workouts to see your history'
                : 'Try adjusting your filters'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map(session => {
              const stats = getSessionStats(session);
              const sessionLogs = allLogs.filter(log => log.session_id === session.id);
              const sessionExerciseIds = new Set(sessionLogs.map(log => log.exercise_id));
              const sessionExercises = exercises.filter(ex => sessionExerciseIds.has(ex.id!));

              const isSelected = selectedForComparison.includes(session.id!);

              return (
                <Card key={session.id} className={`p-6 transition-colors ${
                  isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleComparisonSelection(session.id!)}
                        className="shrink-0"
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <GitCompare className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{session.name}</h3>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Completed
                          </Badge>
                        </div>
                      <p className="text-sm text-muted-foreground">
                        {format(session.scheduled_date, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveAsTemplate(session.id!)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Template
                      </Button>
                      <Link href={`/workout/${session.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-background rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Dumbbell className="w-4 h-4" />
                        <span className="text-xs">Exercises</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.uniqueExercises}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Total Sets</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalSets}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Volume</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.totalVolume} <span className="text-sm font-normal">kg</span></p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Duration</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.duration} <span className="text-sm font-normal">min</span></p>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Exercises:</p>
                    <div className="flex flex-wrap gap-2">
                      {sessionExercises.map(exercise => (
                        <Badge key={exercise.id} variant="secondary">
                          {exercise.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Comparison Modal */}
      {showComparison && selectedForComparison.length === 2 && (
        <SessionComparison
          session1={allSessions!.find(s => s.id === selectedForComparison[0])!}
          session2={allSessions!.find(s => s.id === selectedForComparison[1])!}
          logs1={allLogs.filter(log => log.session_id === selectedForComparison[0])}
          logs2={allLogs.filter(log => log.session_id === selectedForComparison[1])}
          exercises={exercises}
          onClose={() => {
            setShowComparison(false);
            setSelectedForComparison([]);
          }}
        />
      )}
    </div>
  );
}
