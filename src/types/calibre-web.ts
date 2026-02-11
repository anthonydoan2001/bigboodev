// ============ Calibre-Web Book Types ============

export interface CalibreBook {
  id: number;
  title: string;
  authors: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  languages?: string[];
  tags?: string[];
  series?: string;
  seriesIndex?: number;
  formats: string[];
  downloadLinks?: Record<string, string>; // format -> OPDS download path
  coverUrl: string;
  rating?: number;
}

export interface CalibreAuthor {
  id: string;
  name: string;
  url: string;
}

export interface CalibreSeries {
  id: string;
  name: string;
  url: string;
}

export interface CalibreShelf {
  id: string;
  name: string;
  url: string;
}

export interface CalibreBooksResponse {
  configured?: boolean;
  books: CalibreBook[];
  total: number;
}

// ============ Settings Types ============

export interface CalibreWebSettings {
  id: string;
  serverUrl: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibreWebSettingsInput {
  serverUrl: string;
  username: string;
  password: string;
}

// ============ Reading Progress Types ============

export interface BookReadingProgress {
  id: string;
  bookId: string;
  format: string;
  position: string; // CFI for epub, page number for pdf
  progress: number; // 0.0 to 1.0
  createdAt: string;
  updatedAt: string;
}

// ============ Annotation & Bookmark Types ============

export type AnnotationType = 'highlight' | 'underline';
export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface BookAnnotation {
  id: string;
  bookId: string;
  type: AnnotationType;
  cfiRange: string;
  text: string;
  note?: string | null;
  color: AnnotationColor;
  chapter?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookBookmark {
  id: string;
  bookId: string;
  cfi: string;
  label?: string | null;
  chapter?: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnotationInput {
  bookId: string;
  type?: AnnotationType;
  cfiRange: string;
  text: string;
  note?: string;
  color?: AnnotationColor;
  chapter?: string;
}

export interface UpdateAnnotationInput {
  id: string;
  note?: string | null;
  color?: AnnotationColor;
}

export interface CreateBookmarkInput {
  bookId: string;
  cfi: string;
  label?: string;
  chapter?: string;
  progress?: number;
}

// ============ OPDS Feed Types (internal) ============

export interface OPDSEntry {
  id: string;
  title: string;
  authors: string[];
  summary?: string;
  updated?: string;
  links: OPDSLink[];
  categories?: string[];
  content?: string;
  series?: string;
  seriesIndex?: number;
  rating?: number;
  publisher?: string;
  language?: string;
}

export interface OPDSLink {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
}

export interface OPDSFeed {
  title: string;
  entries: OPDSEntry[];
  links: OPDSLink[];
  totalResults?: number;
}
