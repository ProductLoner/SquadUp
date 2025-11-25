import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, TrendingUp, Calendar, Dumbbell, Target, Activity, AlertCircle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useExercises, useLogs } from '@/hooks/useDatabase';
import type { Exercise, Log } from '@/lib/db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';
import { calculateFatigueIndex, analyzeMuscleGroupBalance, calculateTrainingDensity } from '@/lib/advancedAnalytics';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#ef4444',
  Back: '#3b82f6',
  Shoulders: '#f59e0b',
  Biceps: '#8b5cf6',
  Triceps: '#ec4899',
  Quads: '#10b981',
  Hamstrings: '#14b8a6',
  Glutes: '#f97316',
  Calves: '#6366f1',
  Abs: '#84cc16',
};

export default function Analytics() {
  const exercises = useExercises() || [];
  const logs = useLogs() || [];
  const [selectedExercise, setSelectedExercise] = useState<number | 'all'>('all');
  const [dateRange, setDateRange] = useState<number>(30); // days

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRange);
    return logs.filter(log => isAfter(log.session_date, cutoffDate));
  }, [logs, dateRange]);

  // Calculate e1RM progression data
  const e1rmData = useMemo(() => {
    if (selectedExercise === 'all') return [];

    const exerciseLogs = filteredLogs
      .filter((log: Log) => log.exercise_id === selectedExercise)
      .sort((a: Log, b: Log) => a.session_date.getTime() - b.session_date.getTime());

    // Group by date and get max e1RM per day
    const dateMap = new Map<string, number>();
    exerciseLogs.forEach((log: Log) => {
      if (log.e1rm) {
        const dateKey = format(log.session_date, 'yyyy-MM-dd');
        const currentMax = dateMap.get(dateKey) || 0;
        if (log.e1rm > currentMax) {
          dateMap.set(dateKey, log.e1rm);
        }
      }
    });

    return Array.from(dateMap.entries()).map(([date, e1rm]) => ({
      date: format(new Date(date), 'MMM d'),
      e1rm: parseFloat(e1rm.toFixed(1)),
    }));
  }, [filteredLogs, selectedExercise]);

  // Calculate volume data (sets × reps × weight)
  const volumeData = useMemo(() => {
    if (selectedExercise === 'all') return [];

    const exerciseLogs = filteredLogs
      .filter((log: Log) => log.exercise_id === selectedExercise)
      .sort((a: Log, b: Log) => a.session_date.getTime() - b.session_date.getTime());

    // Group by date and sum volume
    const dateMap = new Map<string, number>();
    exerciseLogs.forEach((log: Log) => {
      const dateKey = format(log.session_date, 'yyyy-MM-dd');
      const volume = log.weight * log.reps;
      const currentVolume = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentVolume + volume);
    });

    return Array.from(dateMap.entries()).map(([date, volume]) => ({
      date: format(new Date(date), 'MMM d'),
      volume: parseFloat(volume.toFixed(0)),
    }));
  }, [filteredLogs, selectedExercise]);

  // Calculate muscle group distribution
  const muscleGroupData = useMemo(() => {
    const distribution = new Map<string, number>();

    filteredLogs.forEach((log: Log) => {
      const exercise = exercises.find((ex: Exercise) => ex.id === log.exercise_id);
      if (exercise) {
        const volume = log.weight * log.reps;
        const current = distribution.get(exercise.muscle_group) || 0;
        distribution.set(exercise.muscle_group, current + volume);
      }
    });

    return Array.from(distribution.entries())
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(0)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs, exercises]);

  // Calculate fatigue index
  const fatigueMetrics = useMemo(() => {
    const recentLogs = filteredLogs.slice(-50); // Last ~50 sets
    const weeklyVolumes = [1000, 1200, 1300, 1400]; // Placeholder
    return calculateFatigueIndex(recentLogs, weeklyVolumes);
  }, [filteredLogs]);

  // Calculate muscle group balance
  const balanceAnalysis = useMemo(() => {
    return analyzeMuscleGroupBalance(filteredLogs, exercises);
  }, [filteredLogs, exercises]);

  // Calculate personal records
  const personalRecords = useMemo(() => {
    const records = new Map<number, { weight: number; reps: number; e1rm: number; date: Date }>();

    logs.forEach((log: Log) => {
      if (!log.e1rm) return;
      
      const current = records.get(log.exercise_id);
      if (!current || log.e1rm > current.e1rm) {
        records.set(log.exercise_id, {
          weight: log.weight,
          reps: log.reps,
          e1rm: log.e1rm,
          date: log.session_date,
        });
      }
    });

    return Array.from(records.entries())
      .map(([exerciseId, record]) => {
        const exercise = exercises.find((ex: Exercise) => ex.id === exerciseId);
        return exercise ? { exercise, ...record } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.e1rm - a!.e1rm)
      .slice(0, 5);
  }, [logs, exercises]);

  // Set default exercise when exercises load
  useEffect(() => {
    if (exercises.length > 0 && selectedExercise === 'all') {
      setSelectedExercise(exercises[0].id!);
    }
  }, [exercises, selectedExercise]);

  const selectedExerciseName = useMemo(() => {
    if (selectedExercise === 'all') return 'All Exercises';
    const exercise = exercises.find((ex: Exercise) => ex.id === selectedExercise);
    return exercise?.name || '';
  }, [selectedExercise, exercises]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track your progress with e1RM and volume metrics
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-sm font-medium mb-2 block">Exercise</label>
            <Select
              value={selectedExercise.toString()}
              onValueChange={(value) => setSelectedExercise(value === 'all' ? 'all' : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise: Exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id!.toString()}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select
              value={dateRange.toString()}
              onValueChange={(value) => setDateRange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 2 weeks</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground">
              Complete some workouts to see your analytics
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* e1RM Progression Chart */}
            {selectedExercise !== 'all' && e1rmData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  e1RM Progression - {selectedExerciseName}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={e1rmData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ fill: '#0ea5e9', r: 4 }}
                      name="Estimated 1RM (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Volume Chart */}
            {selectedExercise !== 'all' && volumeData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Volume Progression - {selectedExerciseName}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="volume" fill="#10b981" name="Volume (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Muscle Group Distribution */}
            {muscleGroupData.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Volume by Muscle Group
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={muscleGroupData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {muscleGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MUSCLE_GROUP_COLORS[entry.name] || '#888'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {muscleGroupData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: MUSCLE_GROUP_COLORS[item.name] || '#888' }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.value.toLocaleString()} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Fatigue Index */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Fatigue Index
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Fatigue Level</p>
                    <p className="text-3xl font-bold">
                      {fatigueMetrics.fatigueIndex.toFixed(0)}/100
                    </p>
                  </div>
                  <Badge 
                    variant={fatigueMetrics.fatigueLevel === 'severe' || fatigueMetrics.fatigueLevel === 'high' ? 'destructive' : 'secondary'}
                    className="text-lg capitalize"
                  >
                    {fatigueMetrics.fatigueLevel}
                  </Badge>
                </div>
                
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      fatigueMetrics.fatigueLevel === 'severe' ? 'bg-red-500' :
                      fatigueMetrics.fatigueLevel === 'high' ? 'bg-orange-500' :
                      fatigueMetrics.fatigueLevel === 'moderate' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${fatigueMetrics.fatigueIndex}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Soreness</p>
                    <p className="text-lg font-semibold">{fatigueMetrics.avgSoreness.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Joint Pain</p>
                    <p className="text-lg font-semibold">{fatigueMetrics.avgJointPain.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Performance</p>
                    <p className="text-lg font-semibold capitalize">{fatigueMetrics.performanceTrend}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{fatigueMetrics.recommendation}</p>
                </div>
              </div>
            </Card>

            {/* Muscle Group Balance */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Muscle Group Balance
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Push/Pull Ratio</p>
                    <Badge variant="outline">
                      {balanceAnalysis.pushPullRatio.toFixed(2)}:1
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ideal range: 1:1 to 1:1.5 (push:pull)
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Volume Distribution</p>
                  <div className="space-y-2">
                    {balanceAnalysis.distribution.slice(0, 6).map((mg) => (
                      <div key={mg.muscleGroup} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{mg.muscleGroup}</span>
                          <span className="text-muted-foreground">
                            {mg.totalSets} sets ({mg.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full"
                            style={{ 
                              width: `${mg.percentage}%`,
                              backgroundColor: MUSCLE_GROUP_COLORS[mg.muscleGroup] || '#888'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {balanceAnalysis.imbalances.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Detected Imbalances
                    </p>
                    <div className="space-y-2">
                      {balanceAnalysis.imbalances.map((imbalance, idx) => (
                        <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-sm font-medium mb-1">{imbalance.issue}</p>
                          <p className="text-xs text-muted-foreground">{imbalance.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Personal Records (Top 5)
                </h2>
                <div className="space-y-3">
                  {personalRecords.map((record, index) => (
                    <div
                      key={record!.exercise.id}
                      className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg font-bold">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold">{record!.exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {record!.weight}kg × {record!.reps} reps
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{record!.e1rm.toFixed(1)} kg</p>
                        <p className="text-xs text-muted-foreground">
                          {format(record!.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
