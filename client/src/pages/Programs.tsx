import { useState } from 'react';
import { Link } from 'wouter';
import { Plus, Calendar, TrendingUp, Play, Archive } from 'lucide-react';
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
import { useMesocycles, mesocycleOperations } from '@/hooks/useDatabase';
import type { PhaseType } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';

const phaseTypes: PhaseType[] = ['Hypertrophy', 'Metabolite', 'Resensitization', 'Deload'];

const phaseColors: Record<PhaseType, string> = {
  'Hypertrophy': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Metabolite': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Resensitization': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Deload': 'bg-green-500/10 text-green-500 border-green-500/20',
};

export default function Programs() {
  const mesocycles = useMesocycles();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPhaseType, setFormPhaseType] = useState<PhaseType>('Hypertrophy');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDurationWeeks, setFormDurationWeeks] = useState('4');
  const [formSetAdditionFreq, setFormSetAdditionFreq] = useState('2');

  const handleAdd = async () => {
    if (!formName.trim() || !formStartDate) {
      toast.error('Name and start date are required');
      return;
    }

    const durationWeeks = parseInt(formDurationWeeks);
    if (isNaN(durationWeeks) || durationWeeks < 1) {
      toast.error('Duration must be at least 1 week');
      return;
    }

    const startDate = new Date(formStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));

    try {
      await mesocycleOperations.create({
        name: formName.trim(),
        phase_type: formPhaseType,
        start_date: startDate,
        end_date: endDate,
        set_addition_frequency: parseInt(formSetAdditionFreq),
        is_active: false,
        created_at: new Date(),
      });
      
      toast.success('Mesocycle created successfully');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create mesocycle');
      console.error(error);
    }
  };

  const handleActivate = async (id: number, name: string) => {
    try {
      await mesocycleOperations.activate(id);
      toast.success(`"${name}" is now active`);
    } catch (error) {
      toast.error('Failed to activate mesocycle');
      console.error(error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all associated workouts and logs.`)) return;

    try {
      await mesocycleOperations.delete(id);
      toast.success('Mesocycle deleted successfully');
    } catch (error) {
      toast.error('Failed to delete mesocycle');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPhaseType('Hypertrophy');
    setFormStartDate('');
    setFormDurationWeeks('4');
    setFormSetAdditionFreq('2');
  };

  const activeMesocycles = mesocycles?.filter(m => m.is_active) || [];
  const archivedMesocycles = mesocycles?.filter(m => !m.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Training Programs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your mesocycles and training phases
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Mesocycle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mesocycle</DialogTitle>
                <DialogDescription>
                  Set up a new training block with specific phase characteristics
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Mesocycle Name</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Spring Hypertrophy Block"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phase-type">Phase Type</Label>
                  <Select value={formPhaseType} onValueChange={(v) => setFormPhaseType(v as PhaseType)}>
                    <SelectTrigger id="phase-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {phaseTypes.map(pt => (
                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (weeks)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formDurationWeeks}
                      onChange={(e) => setFormDurationWeeks(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="set-freq">Set Addition Frequency (weeks)</Label>
                  <Select value={formSetAdditionFreq} onValueChange={setFormSetAdditionFreq}>
                    <SelectTrigger id="set-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every week</SelectItem>
                      <SelectItem value="2">Every 2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often to consider adding sets based on performance
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Create Mesocycle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Mesocycles */}
        {activeMesocycles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Active Programs
            </h2>
            <div className="space-y-3">
              {activeMesocycles.map(meso => (
                <Link key={meso.id} href={`/programs/${meso.id}`}>
                  <div className="p-5 bg-card border-2 border-primary rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{meso.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={phaseColors[meso.phase_type]}>
                          {meso.phase_type}
                        </Badge>
                        <Badge variant="outline">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(meso.start_date, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(meso.end_date, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Set Addition Frequency</p>
                      <p className="font-medium">Every {meso.set_addition_frequency} week(s)</p>
                    </div>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Archived Mesocycles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {archivedMesocycles.length > 0 ? 'All Programs' : 'No Programs Yet'}
          </h2>
          
          {archivedMesocycles.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Create your first mesocycle to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedMesocycles.map(meso => (
                <div
                  key={meso.id}
                  className="p-5 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{meso.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={phaseColors[meso.phase_type]}>
                          {meso.phase_type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(meso.id!, meso.name)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meso.id!, meso.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(meso.start_date, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(meso.end_date, 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
