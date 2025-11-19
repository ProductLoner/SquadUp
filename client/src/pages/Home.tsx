import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, BookOpen, BarChart3, Settings, History as HistoryIcon } from 'lucide-react';
import { APP_TITLE } from '@/const';
import { useActiveMesocycle, useUpcomingWorkouts, useLogs } from '@/hooks/useDatabase';
import { DeloadBanner } from '@/components/DeloadBanner';
import { checkDeloadNeed } from '@/lib/deload';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const activeMesocycle = useActiveMesocycle();
  const upcomingWorkouts = useUpcomingWorkouts();
  const allLogs = useLogs() || [];
  const [deloadDismissed, setDeloadDismissed] = useState(false);

  // Check for deload need
  const deloadRecommendation = useMemo(() => {
    if (deloadDismissed) return null;
    return checkDeloadNeed(allLogs);
  }, [allLogs, deloadDismissed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl py-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Advanced hypertrophy training with intelligent autoregulation
          </p>
        </div>
      </header>

      <div className="container max-w-7xl py-12">
        {/* Deload Banner */}
        {deloadRecommendation && deloadRecommendation.needsDeload && (
          <div className="mb-6">
            <DeloadBanner
              recommendation={deloadRecommendation}
              onDismiss={() => setDeloadDismissed(true)}
            />
          </div>
        )}

        {/* Active Program Status */}
        {activeMesocycle && (
          <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Active Program</h2>
                <p className="text-xl font-bold text-primary">{activeMesocycle.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{activeMesocycle.phase_type}</Badge>
                </div>
              </div>
              <Link href="/programs">
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start Workout */}
          <Link href="/workout">
            <div className="p-6 bg-card border-2 border-border rounded-lg hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                {upcomingWorkouts && upcomingWorkouts.length > 0 && (
                  <Badge variant="default">{upcomingWorkouts.length} pending</Badge>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Start Workout</h3>
              <p className="text-muted-foreground">
                Log your training session with live set tracking
              </p>
            </div>
          </Link>

          {/* Programs */}
          <Link href="/programs">
            <div className="p-6 bg-card border-2 border-border rounded-lg hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Programs</h3>
              <p className="text-muted-foreground">
                Manage mesocycles and training phases
              </p>
            </div>
          </Link>

          {/* Exercise Library */}
          <Link href="/exercises">
            <div className="p-6 bg-card border-2 border-border rounded-lg hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Exercise Library</h3>
              <p className="text-muted-foreground">
                Browse and manage your exercise database
              </p>
            </div>
          </Link>

          {/* History */}
          <Link href="/history">
            <div className="p-8 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
              <HistoryIcon className="w-12 h-12 text-purple-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">History</h2>
              <p className="text-muted-foreground">
                View all completed workouts and progress
              </p>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/analytics">
            <div className="p-8 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
              <BarChart3 className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Analytics</h2>
              <p className="text-muted-foreground">
                Track progress with e1RM and volume metrics
              </p>
            </div>
          </Link>
        </div>

        {/* Settings Link */}
        <div className="flex justify-center">
          <Link href="/settings">
            <Button variant="ghost" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings & Data Export
            </Button>
          </Link>
        </div>

        {/* Offline Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-500 font-medium">Offline-Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
