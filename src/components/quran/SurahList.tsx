import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuran } from '@/src/context/QuranContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';

export const SurahList: React.FC = () => {
  const { surahs, loading, isSyncing, syncData, lastRead } = useQuran();
  const [dailyVerse, setDailyVerse] = useState<any>(null);

  useEffect(() => {
    fetchDailyVerse();
  }, []);

  const fetchDailyVerse = async () => {
    try {
      // Get a random ayah for the daily verse
      const randomSurah = Math.floor(Math.random() * 114) + 1;
      const res = await axios.get(`/api/surahs/${randomSurah}`);
      const randomAyah = res.data.ayahs[Math.floor(Math.random() * res.data.ayahs.length)];
      setDailyVerse({ ...randomAyah, surah_name: res.data.name_simple });
    } catch (error) {
      console.error('Failed to fetch daily verse', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (surahs.length === 0 && !isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No data found. Please sync with the server.</p>
        <button 
          onClick={syncData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Sync Quran Data
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Verse Widget */}
        <Card className="lg:col-span-2 overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              Daily Verse
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyVerse ? (
              <div className="space-y-4">
                <p className="arabic-text text-2xl text-right leading-loose">{dailyVerse.text_uthmani}</p>
                <div className="space-y-1">
                  <p className="text-sm line-clamp-2 text-muted-foreground italic">"{dailyVerse.translation_en}"</p>
                  <p className="text-xs font-bold text-primary">{dailyVerse.surah_name} • {dailyVerse.verse_key}</p>
                </div>
              </div>
            ) : (
              <div className="h-24 animate-pulse bg-muted rounded-lg"></div>
            )}
          </CardContent>
        </Card>

        {/* Continue Reading Widget */}
        <Card className="border-dashed border-2 bg-muted/10 flex flex-col justify-center p-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold">Continue Reading</h3>
              <p className="text-xs text-muted-foreground">Pick up where you left off</p>
            </div>
          </div>
          {lastRead ? (
            <Link to={`/surah/${lastRead.surahId}`}>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Resume Surah {lastRead.surahId}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-4">No recent activity found</p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold px-2">All Surahs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surahs.map((surah, index) => (
            <motion.div
              key={surah.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.01 }}
            >
              <Link to={`/surah/${surah.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {surah.id}
                      </div>
                      <div>
                        <h3 className="font-bold">{surah.name_simple}</h3>
                        <p className="text-xs text-muted-foreground">{surah.name_complex}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="arabic-text text-xl font-bold">{surah.name_arabic}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {surah.verses_count} Ayahs
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
