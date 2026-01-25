// ============ Reading Modes ============
export type ReadingMode =
  | 'vertical-scroll'      // Long strip, scroll down (webtoon style)
  | 'horizontal-scroll-ltr' // Long strip, scroll right
  | 'horizontal-scroll-rtl' // Long strip, scroll left
  | 'page-ltr'             // Single page, tap right for next
  | 'page-rtl';            // Single page, tap left for next (traditional manga)

// ============ Komga API Types ============

export interface KomgaSeries {
  id: string;
  libraryId: string;
  name: string;
  url: string;
  created: string;
  lastModified: string;
  fileLastModified: string;
  booksCount: number;
  booksReadCount: number;
  booksUnreadCount: number;
  booksInProgressCount: number;
  metadata: KomgaSeriesMetadata;
  booksMetadata: KomgaBooksMetadata;
  deleted: boolean;
}

export interface KomgaSeriesMetadata {
  status: string;
  statusLock: boolean;
  created: string;
  lastModified: string;
  title: string;
  titleLock: boolean;
  titleSort: string;
  titleSortLock: boolean;
  summary: string;
  summaryLock: boolean;
  readingDirection: string;
  readingDirectionLock: boolean;
  publisher: string;
  publisherLock: boolean;
  ageRating: number | null;
  ageRatingLock: boolean;
  language: string;
  languageLock: boolean;
  genres: string[];
  genresLock: boolean;
  tags: string[];
  tagsLock: boolean;
  totalBookCount: number | null;
  totalBookCountLock: boolean;
  sharingLabels: string[];
  sharingLabelsLock: boolean;
  links: KomgaLink[];
  linksLock: boolean;
  alternateTitles: KomgaAlternateTitle[];
  alternateTitlesLock: boolean;
}

export interface KomgaBooksMetadata {
  created: string;
  lastModified: string;
  authors: KomgaAuthor[];
  tags: string[];
  releaseDate: string | null;
  summary: string;
  summaryNumber: string;
}

export interface KomgaLink {
  label: string;
  url: string;
}

export interface KomgaAlternateTitle {
  label: string;
  title: string;
}

export interface KomgaAuthor {
  name: string;
  role: string;
}

export interface KomgaBook {
  id: string;
  seriesId: string;
  seriesTitle: string;
  libraryId: string;
  name: string;
  url: string;
  number: number;
  created: string;
  lastModified: string;
  fileLastModified: string;
  sizeBytes: number;
  size: string;
  media: KomgaMedia;
  metadata: KomgaBookMetadata;
  readProgress: KomgaReadProgress | null;
  deleted: boolean;
}

export interface KomgaMedia {
  status: string;
  mediaType: string;
  pagesCount: number;
  comment: string;
}

export interface KomgaBookMetadata {
  created: string;
  lastModified: string;
  title: string;
  titleLock: boolean;
  summary: string;
  summaryLock: boolean;
  number: string;
  numberLock: boolean;
  numberSort: number;
  numberSortLock: boolean;
  releaseDate: string | null;
  releaseDateLock: boolean;
  authors: KomgaAuthor[];
  authorsLock: boolean;
  tags: string[];
  tagsLock: boolean;
  isbn: string;
  isbnLock: boolean;
  links: KomgaLink[];
  linksLock: boolean;
}

export interface KomgaReadProgress {
  page: number;
  completed: boolean;
  readDate: string | null;
  created: string;
  lastModified: string;
  deviceId: string;
  deviceName: string;
}

export interface KomgaPage {
  number: number;
  fileName: string;
  mediaType: string;
  width: number;
  height: number;
  sizeBytes: number;
  size: string;
}

// ============ API Response Types ============

export interface KomgaPagedResponse<T> {
  content: T[];
  pageable: {
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: { sorted: boolean; unsorted: boolean; empty: boolean };
  empty: boolean;
}

export type KomgaSeriesResponse = KomgaPagedResponse<KomgaSeries>;
export type KomgaBooksResponse = KomgaPagedResponse<KomgaBook>;

// ============ Reader State Types ============

export interface ReaderSettings {
  readingMode: ReadingMode;
}

export interface ReaderSession {
  bookId: string;
  seriesId: string;
  currentPage: number;
  totalPages: number;
  book: KomgaBook | null;
  pages: KomgaPage[];
}

// ============ Continue Reading Types ============

export interface ContinueReadingItem {
  series: KomgaSeries;
  book: KomgaBook;
  progress: number; // percentage 0-100
}

// ============ Settings Types ============

export interface KomgaSettings {
  id: string;
  serverUrl: string;
  email: string;
  // password is not returned to client
  createdAt: Date;
  updatedAt: Date;
}

export interface KomgaSettingsInput {
  serverUrl: string;
  email: string;
  password: string;
}

// ============ API Request/Response Types ============

export interface UpdateReadProgressRequest {
  page: number;
  completed?: boolean;
}

export interface SeriesFilters {
  search?: string;
  libraryId?: string;
  status?: string;
}
