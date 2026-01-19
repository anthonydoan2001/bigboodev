// Komga API Types

export interface KomgaBook {
  id: string;
  seriesId: string;
  libraryId: string;
  name: string;
  url: string;
  fileLastModified: string;
  size: number;
  sizeBytes: number;
  media: {
    status: string;
    mediaType: string;
    pagesCount: number;
    comment?: string;
  };
  metadata: {
    title: string;
    titleLock: boolean;
    summary: string;
    summaryLock: boolean;
    number: string;
    numberLock: boolean;
    numberSort: number;
    numberSortLock: boolean;
    releaseDate: string;
    releaseDateLock: boolean;
    authors: Array<{
      name: string;
      role: string;
    }>;
    authorsLock: boolean;
    tags: string[];
    tagsLock: boolean;
    isbn: string;
    isbnLock: boolean;
  };
  created: string;
  lastModified: string;
  fileHash: string;
  thumbnailStatus: string;
  readProgress?: KomgaReadProgress;
}

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
  metadata: {
    title: string;
    titleLock: boolean;
    summary: string;
    summaryLock: boolean;
    readingDirection: string;
    publisher: string;
    ageRating?: number;
    language: string;
    status: string;
    genres: string[];
    tags: string[];
    totalBookCount: number;
    collections: string[];
  };
  booksMetadata: {
    authors: Array<{
      name: string;
      role: string;
    }>;
  };
}

export interface KomgaLibrary {
  id: string;
  name: string;
  root: string;
  importComicInfoBook: boolean;
  importComicInfoSeries: boolean;
  importComicInfoCollection: boolean;
  importComicInfoReadList: boolean;
  importEpubBook: boolean;
  importEpubSeries: boolean;
  importMylarSeries: boolean;
  importLocalArtwork: boolean;
  importBarcodeIsbn: boolean;
  scanForceModifiedTime: boolean;
  scanDeep: boolean;
  repairExtensions: boolean;
  convertToCbz: boolean;
  emptyTrashAfterScan: boolean;
  seriesCover: string;
  booksThumbnail: string;
  created: string;
  lastModified: string;
  lastScanned: string;
}

export interface KomgaReadProgress {
  bookId: string;
  userId: string;
  page: number;
  completed: boolean;
  readDate: string;
  created: string;
  lastModified: string;
}

export interface KomgaPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface KomgaSearchResponse extends KomgaPageResponse<KomgaBook> {}

export interface KomgaLibraryStats {
  totalBooks: number;
  totalSeries: number;
  unreadBooks: number;
  inProgressBooks: number;
}
