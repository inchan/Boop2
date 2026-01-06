# Research: Fix Tab-Specific Undo History

**Date**: 2025-01-05
**Feature**: 010-fix-tab-undo

## 문제 분석

### 현재 구현 문제점

`SlateEditor.tsx:126`에서 에디터 인스턴스가 컴포넌트 수준에서 한 번만 생성됨:

```typescript
const [editor] = useState(() => withReact(withHistory(createEditor())));
```

- **문제**: `SlateEditor`가 탭 전환 시 언마운트/리마운트되지 않고 `initialValue` prop만 변경됨
- **결과**: 모든 탭이 동일한 `editor.history` 객체를 공유
- **현재 동작**: 탭 1에서 편집 → 탭 2로 전환 → Cmd+Z → 탭 1의 변경사항이 되돌려짐

### Slate.js History 구조

```typescript
interface History {
  undos: Batch[];  // Undo 스택
  redos: Batch[];  // Redo 스택
}

interface Batch {
  operations: Operation[];
  selectionBefore: Range | null;
}
```

- `editor.history`에 직접 접근 가능
- 히스토리 클리어: `editor.history = { undos: [], redos: [] }`

## 해결 방안 평가

### Option A: 탭별 에디터 인스턴스 (Tab-keyed Editor Instances)

각 탭마다 독립적인 Slate 에디터 인스턴스를 생성하고 관리.

**구현 방식**:
```typescript
// App.tsx에서 탭별 에디터 인스턴스 맵 관리
const editorsRef = useRef<Map<string, Editor>>(new Map());

// 탭 생성 시 에디터 인스턴스 생성
const getOrCreateEditor = (tabId: string) => {
  if (!editorsRef.current.has(tabId)) {
    editorsRef.current.set(tabId, withReact(withHistory(createEditor())));
  }
  return editorsRef.current.get(tabId)!;
};

// SlateEditor에 editor prop 전달
<SlateEditor editor={getOrCreateEditor(activeTabId)} ... />
```

**장점**:
- 완전한 상태 분리 (히스토리, 선택, 커서 등)
- 구현이 직관적
- Slate 내부 상태 충돌 없음

**단점**:
- 메모리 사용량 증가 (탭당 에디터 인스턴스)
- SlateEditor 컴포넌트 수정 필요 (editor를 외부에서 받음)
- 탭 닫기 시 정리 로직 필요

### Option B: 히스토리 저장/복원 (History Save/Restore)

단일 에디터 인스턴스를 유지하고, 탭 전환 시 히스토리를 저장/복원.

**구현 방식**:
```typescript
// 탭별 히스토리 저장소
const historyMapRef = useRef<Map<string, History>>(new Map());

// 탭 전환 시
const switchTab = (newTabId: string) => {
  // 현재 탭 히스토리 저장
  historyMapRef.current.set(activeTabId, { ...editor.history });

  // 새 탭 히스토리 복원 (또는 초기화)
  const savedHistory = historyMapRef.current.get(newTabId);
  editor.history = savedHistory || { undos: [], redos: [] };

  setActiveTabId(newTabId);
};
```

**장점**:
- 메모리 효율적 (단일 에디터 인스턴스)
- 기존 SlateEditor 구조 유지

**단점**:
- 에디터 내부 상태와 히스토리 불일치 위험
- 탭 전환 시 에디터 콘텐츠와 히스토리 동기화 복잡
- 에디터 selection 상태도 별도 관리 필요

### Option C: key prop으로 리마운트 강제

SlateEditor에 `key={activeTabId}`를 설정하여 탭 전환 시 완전히 새로운 컴포넌트로 리마운트.

**구현 방식**:
```typescript
<SlateEditor
  key={activeTabId}  // 탭 전환 시 리마운트
  initialValue={activeTab?.content || ''}
  ...
/>
```

**장점**:
- 가장 단순한 구현
- 완전한 상태 초기화

**단점**:
- 탭 전환 시 히스토리 손실 (FR-002 위반)
- 매번 에디터 재생성으로 성능 저하 가능

## Decision: Option A (탭별 에디터 인스턴스)

**선택 이유**:
1. FR-002 "탭 전환 시 현재 탭의 히스토리가 보존되어야 함" 충족
2. 완전한 상태 분리로 버그 발생 가능성 최소화
3. 구현 복잡도와 안정성 간 최적 균형

**Alternatives Rejected**:
- Option B: 히스토리-에디터 상태 동기화 복잡성 높음
- Option C: 히스토리 보존 요구사항 위반

## 구현 상세

### 1. App.tsx 수정

```typescript
// 탭별 에디터 인스턴스 관리
const editorsRef = useRef<Map<string, Editor>>(new Map());

const getOrCreateEditor = useCallback((tabId: string) => {
  if (!editorsRef.current.has(tabId)) {
    editorsRef.current.set(tabId, withReact(withHistory(createEditor())));
  }
  return editorsRef.current.get(tabId)!;
}, []);

// 탭 닫기 시 에디터 정리
const handleCloseTab = useCallback((id: string) => {
  editorsRef.current.delete(id);  // 메모리 정리
  // ... 기존 탭 닫기 로직
}, [...]);
```

### 2. SlateEditor.tsx 수정

```typescript
interface SlateEditorProps {
  editor: Editor;  // 외부에서 에디터 인스턴스 주입
  initialValue?: string;
  // ...
}

const SlateEditor = forwardRef<SlateEditorHandle, SlateEditorProps>(
  ({ editor, initialValue = '', ... }, ref) => {
    // useState로 editor 생성하던 코드 제거
    // 외부에서 받은 editor 사용
    // ...
  }
);
```

### 3. 초기값 동기화

탭별 에디터가 있으므로, `initialValue` 변경 감지 로직 단순화 가능:
- 탭 전환 시 해당 탭의 에디터 인스턴스가 이미 올바른 콘텐츠를 가지고 있음
- 스크립트 실행 시에만 `setText` 호출

## 테스트 전략

### Unit Tests (Vitest)

1. 에디터 인스턴스 생성/정리 테스트
2. 탭별 히스토리 독립성 테스트

### E2E Tests (Playwright)

1. 탭 1에서 입력 → 탭 2에서 Cmd+Z → 탭 1 변경 없음 확인
2. 탭 전환 후 히스토리 보존 확인
3. 5개 탭 시나리오 테스트

## 메모리 관리

- 탭 닫기 시 `editorsRef.current.delete(tabId)` 호출
- 에디터 인스턴스 참조 해제로 GC 대상됨
- 최대 10개 탭 제한 시 메모리 영향 미미 (에디터당 ~1MB 미만)
