import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import { STATIC_SURAHS } from '../data/surah-list';
import { STATIC_AL_FATIHAH } from '../data/static-surah-1';
import { fetchSurahFromPublicApi } from '../services/quranPublicApi';

interface Ayah {
  id: number;
  surah_id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  text_tajweed?: string;
  translation_en: string;
  translation_bn: string;
  audio_url: string;
}

interface Surah {
  id: number;
  name_arabic: string;
  name_complex: string;
  name_simple: string;
  revelation_place: string;
  revelation_order: number;
  verses_count: number;
  ayahs?: Ayah[];
}

interface QuranContextType {
  surahs: Surah[];
  loading: boolean;
  currentSurah: Surah | null;
  fetchSurah: (id: number) => Promise<void>;
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  bookmarks: number[];
  toggleBookmark: (ayahId: number) => void;
  lastRead: { surahId: number; ayahId: number } | null;
  setLastRead: (surahId: number, ayahId: number) => void;
  streak: number;
  syncData: () => Promise<void>;
  syncFullQuran: () => Promise<void>;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
}

const QuranContext = createContext<QuranContextType | undefined>(undefined);

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surahs, setSurahs] = useState<Surah[]>(STATIC_SURAHS);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('quran-font-size')) || 24);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('quran-theme') as 'light' | 'dark') || 'light');
  const [bookmarks, setBookmarks] = useState<number[]>(() => JSON.parse(localStorage.getItem('quran-bookmarks') || '[]'));
  const [lastRead, setLastReadState] = useState<{ surahId: number; ayahId: number } | null>(() => JSON.parse(localStorage.getItem('quran-last-read') || 'null'));
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('quran-streak')) || 0);
  const [lastReadDate, setLastReadDate] = useState(() => localStorage.getItem('quran-last-read-date') || '');

  useEffect(() => {
    fetchSurahs();
  }, []);

  useEffect(() => {
    localStorage.setItem('quran-font-size', (fontSize || 24).toString());
    localStorage.setItem('quran-theme', theme || 'light');
    localStorage.setItem('quran-bookmarks', JSON.stringify(bookmarks || []));
    localStorage.setItem('quran-last-read', JSON.stringify(lastRead || null));
    localStorage.setItem('quran-streak', (streak || 0).toString());
    localStorage.setItem('quran-last-read-date', lastReadDate || '');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [fontSize, theme, bookmarks, lastRead, streak, lastReadDate]);

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastReadDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastReadDate === yesterdayStr) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(1);
    }
    setLastReadDate(today);
  };

  const fetchSurahs = async () => {
    try {
      const res = await axios.get('/api/surahs');
      if (res.data && res.data.length > 0) {
        setSurahs(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch surahs from API, using static fallback', error);
      // Fallback is already set as initial state
    }
  };

  const syncData = async () => {
    setIsSyncing(true);
    try {
      await axios.post('/api/sync/surahs');
      await fetchSurahs();
      toast.success('Surah list updated');
    } catch (error) {
      console.error('Sync failed', error);
      toast.error('Sync failed. Using offline data.');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFullQuran = async () => {
    setIsSyncing(true);
    try {
      // 1. Ensure surah list is synced
      await axios.post('/api/sync/surahs');
      const res = await axios.get('/api/surahs');
      const surahList = res.data;
      setSurahs(surahList);

      // 2. Sync ayahs for each surah
      setSyncProgress({ current: 0, total: surahList.length });
      for (let i = 0; i < surahList.length; i++) {
        const surah = surahList[i];
        setSyncProgress({ current: i + 1, total: surahList.length });
        await axios.post(`/api/sync/ayahs/${surah.id}`);
      }
      
      toast.success('Full Quran downloaded successfully!');
    } catch (error) {
      console.error('Full sync failed', error);
      toast.error('Full sync failed. Please check your connection.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const fetchSurah = async (id: number) => {
    setLoading(true);
    try {
      // 1. Try local API
      try {
        const res = await axios.get(`/api/surahs/${id}`);
        if (res.data && res.data.ayahs && res.data.ayahs.length > 0) {
          setCurrentSurah(res.data);
          localStorage.setItem(`quran-surah-${id}`, JSON.stringify(res.data));
          setLoading(false);
          return;
        }
      } catch (localErr) {
        console.warn('Local API failed, moving to fallbacks', localErr);
      }

      // 2. Try localStorage fallback (Fastest offline fallback)
      const cached = localStorage.getItem(`quran-surah-${id}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (cachedData && cachedData.ayahs && cachedData.ayahs.length > 0) {
          setCurrentSurah(cachedData);
          toast.info('Using offline cached version');
          setLoading(false);
          return;
        }
      }

      // 3. Try Public API Fallback (Direct from Quran.com)
      try {
        const publicData = await fetchSurahFromPublicApi(id);
        const surahInfo = surahs.find(s => s.id === id) || STATIC_SURAHS.find(s => s.id === id);
        const fullSurah = { ...surahInfo, ...publicData } as Surah;
        setCurrentSurah(fullSurah);
        localStorage.setItem(`quran-surah-${id}`, JSON.stringify(fullSurah));
        toast.info('Fetched from public Quran API');
        setLoading(false);
        return;
      } catch (publicErr) {
        console.warn('Public API fallback failed', publicErr);
      }

      // 4. Ultimate Static Fallback for Surah 1
      if (id === 1) {
        setCurrentSurah(STATIC_AL_FATIHAH as Surah);
        toast.info('Using built-in version of Al-Fatihah');
        setLoading(false);
        return;
      }

      toast.error('Surah data not available. Please check your connection.');
    } catch (error) {
      console.error('Critical failure in fetchSurah', error);
      toast.error('An unexpected error occurred while loading the Surah.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (ayahId: number) => {
    setBookmarks(prev => 
      prev.includes(ayahId) ? prev.filter(id => id !== ayahId) : [...prev, ayahId]
    );
  };

  const setLastRead = (surahId: number, ayahId: number) => {
    setLastReadState({ surahId, ayahId });
    updateStreak();
  };

  return (
    <QuranContext.Provider value={{
      surahs, loading, currentSurah, fetchSurah,
      fontSize, setFontSize, theme, setTheme,
      bookmarks, toggleBookmark, lastRead, setLastRead,
      streak, syncData, syncFullQuran, isSyncing, syncProgress
    }}>
      {children}
    </QuranContext.Provider>
  );
};

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) throw new Error('useQuran must be used within a QuranProvider');
  return context;
};
