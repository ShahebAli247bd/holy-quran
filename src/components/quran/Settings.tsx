import React from 'react';
import { useQuran } from '@/src/context/QuranContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { fontSize, setFontSize, theme, setTheme, syncData, isSyncing } = useQuran();

  const handleClearCache = () => {
    localStorage.clear();
    toast.success('Cache cleared. Please refresh.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-lg">Font Size ({fontSize}px)</Label>
          <Slider 
            value={[fontSize]} 
            min={16} 
            max={64} 
            step={1} 
            onValueChange={(val) => setFontSize(val[0])} 
          />
          <div className="p-4 border rounded-lg bg-muted/20 text-center">
            <p className="arabic-text text-2xl" style={{ fontSize: `${fontSize}px` }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-lg">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
          </div>
          <Switch 
            checked={theme === 'dark'} 
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg">Data Management</Label>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className="justify-start gap-2 h-12" 
              onClick={syncData}
              disabled={isSyncing}
            >
              <RefreshCw className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing Surahs..." : "Sync Surah List"}
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2 h-12 text-destructive hover:text-destructive"
              onClick={handleClearCache}
            >
              <Trash2 />
              Clear Local Cache
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-primary/5 flex gap-4">
          <Info className="h-6 w-6 text-primary shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">About Holy Al Quran</p>
            <p className="text-sm text-muted-foreground">
              This application provides the full Holy Quran with translations in English and Bangla. 
              Audio recitations are provided by Mishary Rashid Alafasy.
              Data is sourced from Quran.com API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
