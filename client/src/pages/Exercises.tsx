import { useState } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useExercises, exerciseOperations } from '@/hooks/useDatabase';
import type { MuscleGroup } from '@/lib/db';
import { toast } from 'sonner';

const muscleGroups: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Forearms'
];

const muscleGroupColors: Record<MuscleGroup, string> = {
  'Chest': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Back': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Shoulders': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Biceps': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Triceps': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Quads': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Hamstrings': 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  'Glutes': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  'Calves': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Abs': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Forearms': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function Exercises() {
  const exercises = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<number | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formMuscleGroup, setFormMuscleGroup] = useState<MuscleGroup>('Chest');
  const [formNotes, setFormNotes] = useState('');

  const filteredExercises = exercises?.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = filterMuscleGroup === 'all' || ex.muscle_group === filterMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  }) || [];

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast.error('Exercise name is required');
      return;
    }

    try {
      await exerciseOperations.create({
        name: formName.trim(),
        muscle_group: formMuscleGroup,
        is_custom: true,
        notes: formNotes.trim() || undefined,
        created_at: new Date(),
      });
      
      toast.success('Exercise added successfully');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add exercise');
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!editingExercise || !formName.trim()) {
      toast.error('Exercise name is required');
      return;
    }

    try {
      await exerciseOperations.update(editingExercise, {
        name: formName.trim(),
        muscle_group: formMuscleGroup,
        notes: formNotes.trim() || undefined,
      });
      
      toast.success('Exercise updated successfully');
      resetForm();
      setEditingExercise(null);
    } catch (error) {
      toast.error('Failed to update exercise');
      console.error(error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await exerciseOperations.delete(id);
      toast.success('Exercise deleted successfully');
    } catch (error) {
      toast.error('Failed to delete exercise');
      console.error(error);
    }
  };

  const openEditDialog = (id: number) => {
    const exercise = exercises?.find(ex => ex.id === id);
    if (!exercise) return;

    setFormName(exercise.name);
    setFormMuscleGroup(exercise.muscle_group);
    setFormNotes(exercise.notes || '');
    setEditingExercise(id);
  };

  const resetForm = () => {
    setFormName('');
    setFormMuscleGroup('Chest');
    setFormNotes('');
  };

  const closeEditDialog = () => {
    resetForm();
    setEditingExercise(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your exercise database
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Exercise</DialogTitle>
                <DialogDescription>
                  Create a custom exercise for your training program
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Exercise Name</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Barbell Bench Press"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="muscle-group">Muscle Group</Label>
                  <Select value={formMuscleGroup} onValueChange={(v) => setFormMuscleGroup(v as MuscleGroup)}>
                    <SelectTrigger id="muscle-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map(mg => (
                        <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Any special notes or form cues..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add Exercise</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterMuscleGroup} onValueChange={(v) => setFilterMuscleGroup(v as MuscleGroup | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {muscleGroups.map(mg => (
                <SelectItem key={mg} value={mg}>{mg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No exercises found</p>
            </div>
          ) : (
            filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-foreground">{exercise.name}</h3>
                    <Badge variant="outline" className={muscleGroupColors[exercise.muscle_group]}>
                      {exercise.muscle_group}
                    </Badge>
                    {exercise.is_custom && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Custom
                      </Badge>
                    )}
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(exercise.id!)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  {exercise.is_custom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id!, exercise.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingExercise !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update exercise details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Exercise Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Barbell Bench Press"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-muscle-group">Muscle Group</Label>
              <Select value={formMuscleGroup} onValueChange={(v) => setFormMuscleGroup(v as MuscleGroup)}>
                <SelectTrigger id="edit-muscle-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map(mg => (
                    <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any special notes or form cues..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
