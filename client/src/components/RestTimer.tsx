import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface RestTimerProps {
  defaultDuration?: number; // in seconds
  onComplete?: () => void;
}

export function RestTimer({ defaultDuration = 120, onComplete }: RestTimerProps) {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        toast.success('Notifications enabled');
      } else {
        toast.error('Notification permission denied');
      }
    } else {
      setNotificationsEnabled(false);
      toast.info('Notifications disabled');
    }
  };

  const sendNotification = useCallback(() => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification('HypertrophyOS', {
        body: 'Rest period complete! Time for your next set.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'rest-timer',
        requireInteraction: false,
      });
    }
  }, [notificationsEnabled]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            sendNotification();
            onComplete?.();
            toast.success('Rest period complete!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, sendNotification, onComplete]);

  const startTimer = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(duration);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(duration);
  };

  const updateDuration = (newDuration: number) => {
    setDuration(newDuration);
    if (!isRunning) {
      setTimeRemaining(newDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Rest Timer</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNotifications}
          className="gap-2"
        >
          {notificationsEnabled ? (
            <>
              <Bell className="w-4 h-4" />
              <span className="text-xs">On</span>
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              <span className="text-xs">Off</span>
            </>
          )}
        </Button>
      </div>

      {/* Timer Display */}
      <div className="relative mb-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-foreground mb-2">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isRunning ? 'Resting...' : timeRemaining === 0 ? 'Ready!' : 'Paused'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Duration Input */}
      {!isRunning && (
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Rest Duration (seconds)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={duration}
              onChange={(e) => updateDuration(parseInt(e.target.value) || 0)}
              min={10}
              max={600}
              step={10}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => updateDuration(90)}
              size="sm"
            >
              90s
            </Button>
            <Button
              variant="outline"
              onClick={() => updateDuration(120)}
              size="sm"
            >
              2m
            </Button>
            <Button
              variant="outline"
              onClick={() => updateDuration(180)}
              size="sm"
            >
              3m
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <Button onClick={startTimer} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            {timeRemaining === 0 ? 'Start' : 'Resume'}
          </Button>
        ) : (
          <Button onClick={pauseTimer} variant="secondary" className="flex-1">
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        )}
        
        <Button onClick={resetTimer} variant="outline">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {!isRunning && timeRemaining > 0 && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTimeRemaining(0);
              toast.info('Rest skipped');
            }}
            className="flex-1 text-xs"
          >
            Skip Rest
          </Button>
        </div>
      )}
    </Card>
  );
}
