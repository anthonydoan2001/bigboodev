export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

export interface GmailResponse {
  emails: GmailEmail[];
  unreadCount: number;
  connected: boolean;
}

export interface GmailTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}
