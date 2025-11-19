import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Calendar, Dumbbell, TrendingUp, Clock, Filter } from 'lucide-react';
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
import { useWorkoutSessions, useLogs, useExercises } from '@/hooks/useDatabase';
import type { WorkoutSession, Log, Exercise } from '@/lib/db';
import { format, isAfter, subDays, subMonths } from 'date-fns';

export default function History() {
  const allSessions = useWorkoutSessions();
  const allLogs = useLogs() || [];
  const exercises = useExercises() || [];
  
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');

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

              return (
                <Card key={session.id} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
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
                    
                    <Link href={`/workout/${session.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
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
    </div>
  );
}
