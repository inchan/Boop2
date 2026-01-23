// Find feature TypeScript interfaces

export interface SearchMatch {
  id: string;
  start: number;
  end: number;
  line: number;
}

export interface FindState {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matches: SearchMatch[];
  activeIndex: number;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface FindPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (term: string) => void;
  onReplace: (term: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onReplaceCurrent: () => void;
  onReplaceAll: () => void;
  matchCount: number;
  activeIndex: number;
  hasNoMatches: boolean;
  replaceTerm: string;
}

export interface UseFindOptions {
  documentText: string;
  initialOpen?: boolean;
  onReplace?: (newText: string) => void;
}

export interface UseFindReturn {
  findState: FindState;
  openFind: () => void;
  closeFind: () => void;
  toggleFind: () => void;
  setSearchTerm: (term: string) => void;
  setReplaceTerm: (term: string) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  clearSearch: () => void;
  replaceCurrent: () => void;
  replaceAll: () => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
}
