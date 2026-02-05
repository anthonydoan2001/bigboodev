'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';

export function ImagePlaceholderWidget() {
  return (
    <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
      <CardContent className="p-4 h-full">
        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border/40 rounded-lg">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Images</p>
        </div>
      </CardContent>
    </Card>
  );
}
