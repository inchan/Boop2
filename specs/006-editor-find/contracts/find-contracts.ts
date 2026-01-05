// Find Feature TypeScript Contracts

// ============================================
// Find State Management
// ============================================

export interface SearchMatch {
  id: string;
  start: number;
  end: number;
  line: number;
}

export interface FindState {
  isOpen: boolean;
  searchTerm: string;
  matches: SearchMatch[];
  activeIndex: number;
  isComposing: boolean;
}

// ============================================
// Find Panel Component Props
// ============================================

export interface FindPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (term: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  matchCount: number;
  activeIndex: number;
  hasNoMatches: boolean;
}

// ============================================
// useFind Hook Interface
// ============================================

export interface UseFindOptions {
  documentText: string;
  initialOpen?: boolean;
}

export interface UseFindReturn {
  findState: FindState;
  openFind: () => void;
  closeFind: () => void;
  toggleFind: () => void;
  setSearchTerm: (term: string) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  clearSearch: () => void;
}

// ============================================
// Search Utility Functions
// ============================================

export interface SearchResult {
  matches: SearchMatch[];
  totalCount: number;
  durationMs: number;
}

export function findMatches(
  text: string,
  query: string,
  options?: { caseSensitive?: boolean; maxResults?: number }
): SearchResult;

export function highlightRanges(
  text: string,
  matches: SearchMatch[]
): Array<{ text: string; isMatch: boolean }>;
