/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuranProvider } from './context/QuranContext';
import { Navbar } from './components/layout/Navbar';
import { SurahList } from './components/quran/SurahList';
import { SurahView } from './components/quran/SurahView';
import { Search } from './components/quran/Search';
import { Bookmarks } from './components/quran/Bookmarks';
import { Settings } from './components/quran/Settings';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <QuranProvider>
      <TooltipProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto">
              <Routes>
                <Route path="/" element={<SurahList />} />
                <Route path="/surah/:id" element={<SurahView />} />
                <Route path="/search" element={<Search />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <Toaster position="top-center" />
          </div>
        </Router>
      </TooltipProvider>
    </QuranProvider>
  );
}
