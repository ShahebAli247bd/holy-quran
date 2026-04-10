import React from 'react';
import { Bookmark, Play, Share2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuran } from '@/src/context/QuranContext';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface AyahCardProps {
  ayah: {
    id: number;
    surah_id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    text_tajweed?: string;
    translation_en: string;
    translation_bn: string;
    audio_url: string;
  };
  isActive?: boolean;
  onPlay?: () => void;
}

export const AyahCard: React.FC<AyahCardProps> = ({ ayah, isActive, onPlay }) => {
  const { fontSize, bookmarks, toggleBookmark } = useQuran();
  const cardRef = React.useRef<HTMLDivElement>(null);

  const isBookmarked = bookmarks.includes(ayah.id);

  const handleShare = async () => {
    const text = `Quran ${ayah.verse_key}\n\nArabic: ${ayah.text_uthmani}\n\nEnglish: ${ayah.translation_en}\n\nBangla: ${ayah.translation_bn}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quran ${ayah.verse_key}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  const takeScreenshot = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `quran-${ayah.verse_key}.png`;
      link.click();
      toast.success('Screenshot saved');
    }
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "p-6 border-b transition-all duration-300",
        isActive ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
            {ayah.verse_number}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{ayah.verse_key}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPlay}>
            <Play className={cn("h-4 w-4", isActive && "text-primary fill-primary")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => toggleBookmark(ayah.id)}>
            <Bookmark className={cn("h-4 w-4", isBookmarked && "text-primary fill-primary")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={takeScreenshot}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {ayah.text_tajweed ? (
          <p 
            className="arabic-text text-right leading-loose" 
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: ayah.text_tajweed }}
          />
        ) : (
          <p 
            className="arabic-text text-right leading-loose" 
            style={{ fontSize: `${fontSize}px` }}
          >
            {ayah.text_uthmani}
          </p>
        )}
        
        <div className="space-y-4">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground mr-2">EN:</span>
            {ayah.translation_en}
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed bengali-text">
            <span className="font-bold text-foreground mr-2">BN:</span>
            {ayah.translation_bn}
          </p>
        </div>
      </div>
    </div>
  );
};
