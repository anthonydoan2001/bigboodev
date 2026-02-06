'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchGmailEmails, connectGmail } from '@/lib/api/gmail';
import { GmailEmail } from '@/types/gmail';
import { useQuery } from '@tanstack/react-query';
import { Mail, Circle } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Format date to relative time (e.g., "2h ago", "Yesterday")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Truncate text to specified length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Open email in Gmail
 */
function openInGmail(messageId: string): void {
  window.open(`https://mail.google.com/mail/u/0/#inbox/${messageId}`, '_blank');
}

const EmailItem = memo(function EmailItem({ email }: { email: GmailEmail }) {
  const handleClick = useCallback(() => {
    openInGmail(email.id);
  }, [email.id]);

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-2 md:gap-[var(--dash-gap-sm)] px-2 md:px-[var(--dash-px)] py-1.5 md:py-[var(--dash-py)] text-left hover:bg-muted/30 transition-colors rounded group border-b border-border/20 last:border-b-0"
    >
      {/* Unread indicator */}
      {email.isUnread ? (
        <Circle className="w-2 h-2 fill-info text-info flex-shrink-0" />
      ) : (
        <Circle className="w-2 h-2 text-transparent flex-shrink-0" />
      )}

      {/* Sender */}
      <span
        className={cn(
          'text-xs md:text-[length:var(--dash-text-sm)] truncate flex-shrink-0 w-20 md:w-24',
          email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
        )}
      >
        {truncate(email.from, 16)}
      </span>

      {/* Subject */}
      <span
        className={cn(
          'text-[11px] md:text-[length:var(--dash-text-xs)] truncate flex-1 min-w-0',
          email.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}
      >
        {email.subject}
      </span>

      {/* Time */}
      <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground flex-shrink-0">
        {formatRelativeTime(email.date)}
      </span>
    </button>
  );
});

// Row height scales with viewport height via CSS vars
function getEmailRowHeight(): number {
  if (typeof window === 'undefined') return 36;
  // Use 3.3vh for row height (matches padding + text sizing from CSS vars)
  return Math.max(28, Math.round(window.innerHeight * 0.033));
}

function getHeaderHeight(): number {
  if (typeof window === 'undefined') return 40;
  // Use 4vh for header height
  return Math.max(32, Math.round(window.innerHeight * 0.04));
}

export const GmailWidget = memo(function GmailWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const { data, isLoading, error } = useQuery({
    queryKey: ['gmail'],
    queryFn: fetchGmailEmails,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calcVisible = () => {
      const available = el.clientHeight - getHeaderHeight();
      const count = Math.max(1, Math.floor(available / getEmailRowHeight()));
      setVisibleCount(Math.min(count, 10));
    };

    calcVisible();

    const observer = new ResizeObserver(calcVisible);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 flex flex-col">
        <CardContent ref={containerRef} className="p-3 md:p-[var(--dash-px)] flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2 md:mb-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-4 h-4" rounded="sm" />
              <Skeleton className="h-3.5 w-14" />
            </div>
            <Skeleton className="h-3.5 w-8" rounded="sm" />
          </div>
          <div className="flex-1 space-y-0.5">
            {Array.from({ length: Math.min(visibleCount, 5) }, (_, i) => (
              <div key={i} className="flex items-center gap-2 py-2 md:py-2.5 px-2" style={{ animationDelay: `${i * 80}ms` }}>
                <Skeleton className="w-2 h-2 flex-shrink-0" rounded="full" />
                <Skeleton className="h-3 w-20 flex-shrink-0" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-2.5 w-10 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 flex flex-col">
        <CardContent ref={containerRef} className="p-3 md:p-[var(--dash-px)] flex flex-col flex-1 min-h-0 justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 md:w-[var(--dash-icon-md)] md:h-[var(--dash-icon-md)] text-muted-foreground" />
            <span className="text-sm md:text-[length:var(--dash-text-base)] font-medium">Gmail</span>
          </div>
          <p className="text-sm md:text-[length:var(--dash-text-base)] text-muted-foreground text-center py-4">
            Failed to load emails
          </p>
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!data?.connected) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 flex flex-col">
        <CardContent ref={containerRef} className="p-3 md:p-[var(--dash-px)] flex flex-col flex-1 min-h-0 justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 md:w-[var(--dash-icon-md)] md:h-[var(--dash-icon-md)] text-muted-foreground" />
            <span className="text-sm md:text-[length:var(--dash-text-base)] font-medium">Gmail</span>
          </div>
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <p className="text-sm md:text-[length:var(--dash-text-base)] text-muted-foreground text-center">
              Connect your Gmail to see recent emails
            </p>
            <Button
              onClick={connectGmail}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Connect Gmail
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state - show only as many emails as fit
  const displayEmails = data.emails.slice(0, visibleCount);

  return (
    <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 flex flex-col">
      <CardContent ref={containerRef} className="p-3 md:p-[var(--dash-px)] flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 md:mb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 md:w-[var(--dash-icon-md)] md:h-[var(--dash-icon-md)] text-muted-foreground" />
            <span className="text-sm md:text-[length:var(--dash-text-base)] font-semibold">Gmail</span>
          </div>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-[length:var(--dash-text-sm)] text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Open
          </a>
        </div>

        {/* Email list - dynamically shows as many as fit */}
        {displayEmails.length > 0 ? (
          <div className="flex-1 flex flex-col -mx-1 min-h-0">
            {displayEmails.map((email) => (
              <EmailItem key={email.id} email={email} />
            ))}
          </div>
        ) : (
          <p className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground text-center py-3">
            No emails in inbox
          </p>
        )}
      </CardContent>
    </Card>
  );
});
