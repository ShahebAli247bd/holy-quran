import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Search, Bookmark, Settings, BookOpen, Flame } from 'lucide-react';
import { useQuran } from '@/src/context/QuranContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Navbar: React.FC = () => {
  const { theme, setTheme, streak } = useQuran();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">Holy Al Quran</span>
        </Link>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-none">
              <Flame className="h-3 w-3 fill-current" />
              {streak}
            </Badge>
          )}
          <Link to="/search">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/bookmarks">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
