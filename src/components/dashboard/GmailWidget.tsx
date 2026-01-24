'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      className="w-full flex items-start gap-3 py-2.5 px-3 text-left hover:bg-muted/30 transition-colors rounded-md group"
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 pt-1.5">
        {email.isUnread ? (
          <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
        ) : (
          <Circle className="w-2 h-2 text-transparent" />
        )}
      </div>

      {/* Email content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-body-sm truncate',
              email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
            )}
          >
            {truncate(email.from, 20)}
          </span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {formatRelativeTime(email.date)}
          </span>
        </div>
        <p
          className={cn(
            'text-body-sm truncate',
            email.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          {email.subject}
        </p>
        <p className="text-[11px] text-muted-foreground/70 truncate">
          {email.snippet}
        </p>
      </div>

      {/* External link icon on hover */}
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
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
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-muted/30 animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted/30 animate-pulse rounded" />
            </div>
            <div className="h-5 w-8 bg-muted/30 animate-pulse rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 bg-muted/30 animate-pulse rounded-full mt-1.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-24 bg-muted/30 animate-pulse rounded" />
                    <div className="h-3 w-12 bg-muted/20 animate-pulse rounded" />
                  </div>
                  <div className="h-3.5 w-3/4 bg-muted/30 animate-pulse rounded" />
                  <div className="h-3 w-full bg-muted/20 animate-pulse rounded" />
                </div>
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
  const displayEmails = data.emails.slice(0, 5);

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-body-sm font-medium">Gmail</span>
            {data.unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded-full min-w-[18px] text-center">
                {data.unreadCount > 99 ? '99+' : data.unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Disconnect Gmail"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Email list */}
        {displayEmails.length > 0 ? (
          <div className="space-y-0.5 -mx-1">
            {displayEmails.map((email) => (
              <EmailItem key={email.id} email={email} />
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground text-center py-6">
            No emails in inbox
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            View all in Gmail
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
});
