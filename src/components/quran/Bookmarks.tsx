import React, { useEffect, useState } from 'react';
import { useQuran } from '@/src/context/QuranContext';
import { AyahCard } from './AyahCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import axios from 'axios';

export const Bookmarks: React.FC = () => {
  const { bookmarks } = useQuran();
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookmarks.length > 0) {
      fetchBookmarks();
    } else {
      setBookmarkedAyahs([]);
    }
  }, [bookmarks]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      // In a real app, we'd have a bulk fetch API. 
      // For now, we'll fetch them individually or use a search-like query if possible.
      // Since we're using SQLite, let's add a route for this.
      const res = await axios.get(`/api/bookmarks?ids=${bookmarks.join(',')}`);
      setBookmarkedAyahs(res.data);
    } catch (error) {
      console.error('Failed to fetch bookmarks', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b bg-muted/20 flex items-center gap-2">
        <BookmarkIcon className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">My Bookmarks</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bookmarkedAyahs.length > 0 ? (
            bookmarkedAyahs.map((ayah) => (
              <AyahCard key={ayah.id} ayah={ayah} />
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              You haven't bookmarked any verses yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
