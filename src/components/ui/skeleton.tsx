'use client';

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: 'default' | 'shimmer' | 'wave';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

function Skeleton({
  className,
  variant = 'shimmer',
  rounded = 'md',
  style,
  ...props
}: SkeletonProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted relative overflow-hidden",
        roundedClass,
        variant === 'shimmer' && "before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:bg-[length:200%_100%]",
        variant === 'default' && "animate-pulse",
        variant === 'wave' && "animate-pulse",
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Composite skeleton patterns for common use cases

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

function SkeletonText({
  lines = 3,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '2/3';
}

function SkeletonCard({
  className,
  aspectRatio = '16/9',
}: SkeletonCardProps) {
  const aspectClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '2/3': 'aspect-[2/3]',
  }[aspectRatio];

  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className={cn(aspectClass, "w-full")} rounded="lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonAvatarProps) {
  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }[size];

  return <Skeleton className={cn(sizeClass, className)} rounded="full" />;
}

interface SkeletonListItemProps {
  showAvatar?: boolean;
  className?: string;
}

function SkeletonListItem({
  showAvatar = true,
  className,
}: SkeletonListItemProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showAvatar && <SkeletonAvatar size="md" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonListItem,
}
