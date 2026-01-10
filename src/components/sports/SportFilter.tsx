import { SportType } from '@/types/sports';
import { cn } from '@/lib/utils';
import { Trophy, Users, Star } from 'lucide-react';

interface SportFilterProps {
  selectedSport: SportType | 'FAVORITES';
  onSportChange: (sport: SportType | 'FAVORITES') => void;
}

const SPORTS: { value: SportType | 'FAVORITES'; label: string; icon: any }[] = [
  { value: 'FAVORITES', label: 'Favorites', icon: Star },
  { value: 'NBA', label: 'NBA', icon: Trophy },
  { value: 'NFL', label: 'NFL', icon: Users },
];

export function SportFilter({ selectedSport, onSportChange }: SportFilterProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <div className="bg-muted/50 p-1 rounded-full flex gap-1">
        {SPORTS.map((sport) => {
          const Icon = sport.icon;
          const isSelected = selectedSport === sport.value;
          const isFavorites = sport.value === 'FAVORITES';

          return (
            <button
              key={sport.value}
              onClick={() => onSportChange(sport.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isSelected
                  ? isFavorites
                    ? "bg-yellow-500/10 shadow-sm text-yellow-600 dark:text-yellow-500 scale-105"
                    : "bg-background shadow-sm text-foreground scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className={cn("w-4 h-4", isFavorites && isSelected && "fill-yellow-500")} />
              {sport.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

