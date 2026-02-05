'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchGmailEmails, connectGmail, disconnectGmail } from '@/lib/api/gmail';
import { GmailEmail } from '@/types/gmail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, ExternalLink, Circle, LogOut } from 'lucide-react';
import { memo, useCallback } from 'react';
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
      className="w-full flex items-center gap-1.5 py-1 px-2 text-left hover:bg-muted/30 transition-colors rounded group"
    >
      {/* Unread indicator */}
      {email.isUnread ? (
        <Circle className="w-1.5 h-1.5 fill-info text-info flex-shrink-0" />
      ) : (
        <Circle className="w-1.5 h-1.5 text-transparent flex-shrink-0" />
      )}

      {/* Sender */}
      <span
        className={cn(
          'text-[11px] truncate flex-shrink-0 w-16',
          email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
        )}
      >
        {truncate(email.from, 14)}
      </span>

      {/* Subject */}
      <span
        className={cn(
          'text-[10px] truncate flex-1 min-w-0',
          email.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}
      >
        {email.subject}
      </span>

      {/* Time */}
      <span className="text-[9px] text-muted-foreground flex-shrink-0">
        {formatRelativeTime(email.date)}
      </span>
    </button>
  );
});

export const GmailWidget = memo(function GmailWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['gmail'],
    queryFn: fetchGmailEmails,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectGmail();
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
    }
  }, [queryClient]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 flex flex-col">
        <CardContent className="p-2.5 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5" rounded="sm" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3" rounded="sm" />
          </div>
          <div className="flex-1 space-y-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 px-2" style={{ animationDelay: `${i * 100}ms` }}>
                <Skeleton className="w-1.5 h-1.5 flex-shrink-0" rounded="full" />
                <Skeleton className="h-2.5 w-16 flex-shrink-0" />
                <Skeleton className="h-2.5 flex-1" />
                <Skeleton className="h-2 w-8 flex-shrink-0" />
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
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-body-sm font-medium">Gmail</span>
          </div>
          <p className="text-body-sm text-muted-foreground text-center py-4">
            Failed to load emails
          </p>
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!data?.connected) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-body-sm font-medium">Gmail</span>
          </div>
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <p className="text-body-sm text-muted-foreground text-center">
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

  // Connected state - show emails
  const displayEmails = data.emails.slice(0, 10);

  return (
    <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:shadow-md flex flex-col">
      <CardContent className="p-2.5 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Gmail</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Disconnect Gmail"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>

        {/* Email list */}
        {displayEmails.length > 0 ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 -mx-0.5 min-h-0">
            {displayEmails.map((email) => (
              <EmailItem key={email.id} email={email} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            No emails in inbox
          </p>
        )}

        {/* Footer */}
        <div className="mt-1.5 pt-1.5 border-t border-border/40 flex-shrink-0">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-[0.65rem] text-primary hover:text-primary/80 transition-colors uppercase tracking-wide font-medium"
          >
            View all in Gmail
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
});
