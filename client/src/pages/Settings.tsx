import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Download, Upload, Database, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/db';
import { workoutTemplateOperations } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { APP_TITLE } from '@/const';

export default function Settings() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exercises: await db.exercises.toArray(),
        mesocycles: await db.mesocycles.toArray(),
        microcycles: await db.microcycles.toArray(),
        workout_sessions: await db.workout_sessions.toArray(),
        session_exercises: await db.session_exercises.toArray(),
        logs: await db.logs.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hypertrophyos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Database exported successfully');
    } catch (error) {
      toast.error('Failed to export database');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const logs = await db.logs.toArray();
      
      // CSV header
      let csv = 'Date,Exercise ID,Set Number,Weight (kg),Reps,RIR,Target RIR,e1RM,Soreness,Pump,Joint Pain\n';
      
      // CSV rows
      for (const log of logs) {
        csv += `${log.session_date.toISOString()},${log.exercise_id},${log.set_number},${log.weight},${log.reps},${log.rir},${log.target_rir},${log.e1rm || ''},${log.feedback_soreness || ''},${log.feedback_pump || ''},${log.feedback_joint_pain || ''}\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hypertrophyos-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Logs exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Clear existing data
      await db.transaction('rw', [db.exercises, db.mesocycles, db.microcycles, db.workout_sessions, db.session_exercises, db.logs], async () => {
        await db.exercises.clear();
        await db.mesocycles.clear();
        await db.microcycles.clear();
        await db.workout_sessions.clear();
        await db.session_exercises.clear();
        await db.logs.clear();

        // Import data
        if (data.exercises) await db.exercises.bulkAdd(data.exercises);
        if (data.mesocycles) await db.mesocycles.bulkAdd(data.mesocycles);
        if (data.microcycles) await db.microcycles.bulkAdd(data.microcycles);
        if (data.workout_sessions) await db.workout_sessions.bulkAdd(data.workout_sessions);
        if (data.session_exercises) await db.session_exercises.bulkAdd(data.session_exercises);
        if (data.logs) await db.logs.bulkAdd(data.logs);
      });

      toast.success('Database imported successfully');
    } catch (error) {
      toast.error('Failed to import database');
      console.error(error);
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExportTemplates = async () => {
    setIsExporting(true);
    try {
      const templates = await db.workout_templates.toArray();
      const dataStr = JSON.stringify(templates, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hypertrophy-templates-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Templates exported successfully');
    } catch (error) {
      toast.error('Failed to export templates');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const templates = JSON.parse(text);
      
      if (!Array.isArray(templates)) {
        toast.error('Invalid template file format');
        return;
      }

      let imported = 0;
      for (const template of templates) {
        // Remove id to avoid conflicts
        const { id, ...templateData } = template;
        await workoutTemplateOperations.create(templateData);
        imported++;
      }

      toast.success(`Imported ${imported} template(s)`);
      event.target.value = ''; // Reset input
    } catch (error) {
      toast.error('Failed to import templates');
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) return;
    if (!confirm('This will permanently delete all exercises, programs, and workout logs. Are you absolutely sure?')) return;

    try {
      await db.transaction('rw', [db.exercises, db.mesocycles, db.microcycles, db.workout_sessions, db.session_exercises, db.logs], async () => {
        await db.logs.clear();
        await db.session_exercises.clear();
        await db.workout_sessions.clear();
        await db.microcycles.clear();
        await db.mesocycles.clear();
        await db.exercises.clear();
      });

      toast.success('All data cleared');
    } catch (error) {
      toast.error('Failed to clear data');
      console.error(error);
    }
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
          
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your data and application preferences
          </p>
        </div>

        {/* Data Export Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Data Export</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FileJson className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Export to JSON</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export complete database including all exercises, programs, and logs
                    </p>
                    <Button
                      onClick={handleExportJSON}
                      disabled={isExporting}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export JSON'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Export Logs to CSV</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export workout logs in CSV format for analysis in spreadsheets
                    </p>
                    <Button
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Template Export/Import Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Workout Templates</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Export Templates</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export your workout templates to share or backup
                    </p>
                    <Button
                      onClick={handleExportTemplates}
                      disabled={isExporting}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export Templates'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Import Templates</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import templates from a JSON file
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportTemplates}
                      disabled={isImporting}
                      className="hidden"
                      id="import-templates"
                    />
                    <label htmlFor="import-templates" className="flex-1">
                      <Button
                        asChild
                        disabled={isImporting}
                        variant="outline"
                        className="w-full"
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? 'Importing...' : 'Import Templates'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Data Import Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Data Import</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Upload className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Import from JSON</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restore your data from a previous JSON export. This will replace all existing data.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      disabled={isImporting}
                      className="hidden"
                      id="import-file"
                    />
                    <label htmlFor="import-file" className="flex-1">
                      <Button
                        asChild
                        disabled={isImporting}
                        variant="outline"
                        className="w-full"
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? 'Importing...' : 'Import JSON'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Danger Zone */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
            <Card className="p-6 border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <Database className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Clear All Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete all data from the database. This action cannot be undone.
                  </p>
                  <Button
                    onClick={handleClearData}
                    variant="destructive"
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* App Info */}
          <div className="pt-6 border-t border-border">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">App Name:</strong> {APP_TITLE}</p>
              <p><strong className="text-foreground">Version:</strong> 1.0.0 (Sprint 1)</p>
              <p><strong className="text-foreground">Database:</strong> Dexie.js (IndexedDB)</p>
              <p><strong className="text-foreground">Offline Support:</strong> PWA Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
