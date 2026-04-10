import React from 'react';
import { useQuran } from '@/src/context/QuranContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Info, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export const Settings: React.FC = () => {
  const { fontSize, setFontSize, theme, setTheme, syncData, syncFullQuran, isSyncing, syncProgress } = useQuran();

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
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-12" 
                onClick={syncData}
                disabled={isSyncing}
              >
                <RefreshCw className={isSyncing && !syncProgress ? "animate-spin" : ""} />
                {isSyncing && !syncProgress ? "Syncing Surahs..." : "Sync Surah List"}
              </Button>
              <p className="text-xs text-muted-foreground px-1">
                Updates the list of 114 Surahs.
              </p>
            </div>

            <div className="grid gap-2">
              <Button 
                variant="default" 
                className="justify-start gap-2 h-12" 
                onClick={syncFullQuran}
                disabled={isSyncing}
              >
                {isSyncing && syncProgress ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                {isSyncing && syncProgress 
                  ? `Downloading Quran (${syncProgress.current}/${syncProgress.total})...` 
                  : "Download Full Quran (Offline Access)"}
              </Button>
              {syncProgress && (
                <div className="space-y-1 px-1">
                  <Progress value={(syncProgress.current / syncProgress.total) * 100} />
                  <p className="text-[10px] text-right text-muted-foreground">
                    {Math.round((syncProgress.current / syncProgress.total) * 100)}% Complete
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground px-1">
                Downloads all 6,236 verses with translations and audio links for offline use.
              </p>
            </div>

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
