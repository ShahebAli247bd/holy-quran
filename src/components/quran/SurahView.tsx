import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuran } from '@/src/context/QuranContext';
import { AyahCard } from './AyahCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AudioPlayer } from './AudioPlayer';

export const SurahView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSurah, fetchSurah, loading, setLastRead } = useQuran();
  const [activeAyahIndex, setActiveAyahIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSurah(Number(id));
      setActiveAyahIndex(null);
      setIsAutoPlaying(false);
    }
  }, [id]);

  if (loading || !currentSurah) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handlePlayAyah = (index: number) => {
    setActiveAyahIndex(index);
    setIsAutoPlaying(true);
    setLastRead(currentSurah.id, currentSurah.ayahs![index].id);
  };

  const handleNext = () => {
    if (activeAyahIndex !== null && activeAyahIndex < currentSurah.ayahs!.length - 1) {
      setActiveAyahIndex(activeAyahIndex + 1);
    } else if (activeAyahIndex === currentSurah.ayahs!.length - 1) {
      // Go to next surah
      if (currentSurah.id < 114) {
        navigate(`/surah/${currentSurah.id + 1}`);
      } else {
        setIsAutoPlaying(false);
        setActiveAyahIndex(null);
      }
    }
  };

  const handlePrev = () => {
    if (activeAyahIndex !== null && activeAyahIndex > 0) {
      setActiveAyahIndex(activeAyahIndex - 1);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">{currentSurah.name_simple}</h2>
            <p className="text-xs text-muted-foreground">{currentSurah.name_complex} • {currentSurah.verses_count} Ayahs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => handlePlayAyah(0)}
          >
            <PlayCircle className="h-4 w-4" />
            Play Surah
          </Button>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={currentSurah.id <= 1}
              onClick={() => navigate(`/surah/${currentSurah.id - 1}`)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={currentSurah.id >= 114}
              onClick={() => navigate(`/surah/${currentSurah.id + 1}`)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto">
          {currentSurah.id !== 1 && currentSurah.id !== 9 && (
            <div className="py-12 text-center">
              <p className="arabic-text text-4xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            </div>
          )}
          {currentSurah.ayahs?.map((ayah, index) => (
            <AyahCard 
              key={ayah.id} 
              ayah={ayah} 
              isActive={activeAyahIndex === index}
              onPlay={() => handlePlayAyah(index)}
            />
          ))}
        </div>
      </ScrollArea>

      {isAutoPlaying && activeAyahIndex !== null && currentSurah.ayahs && (
        <AudioPlayer 
          url={currentSurah.ayahs[activeAyahIndex].audio_url}
          title={currentSurah.name_simple}
          subtitle={`Ayah ${currentSurah.ayahs[activeAyahIndex].verse_number}`}
          translationEn={currentSurah.ayahs[activeAyahIndex].translation_en}
          translationBn={currentSurah.ayahs[activeAyahIndex].translation_bn}
          onClose={() => {
            setIsAutoPlaying(false);
            setActiveAyahIndex(null);
          }}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
};
