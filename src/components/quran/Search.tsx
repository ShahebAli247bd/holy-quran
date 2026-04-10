import React, { useState } from 'react';
import { useQuran } from '@/src/context/QuranContext';
import { AyahCard } from './AyahCard';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b bg-muted/20">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in English, Bangla, or Arabic..."
            className="pl-10 h-12 text-lg"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
        </form>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto">
          {results.length > 0 ? (
            results.map((ayah) => (
              <div key={ayah.id} className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                    {ayah.surah_name}
                  </span>
                </div>
                <AyahCard ayah={ayah} />
              </div>
            ))
          ) : query && !loading ? (
            <div className="p-12 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Enter a keyword to search the Quran
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
