# Feature Specification: Find Feature Highlight & Navigation Fixes

**Feature Branch**: `008-find-highlight-fixes`  
**Created**: 2026-01-05  
**Status**: Draft  
**Priority**: P1 (Critical Bug Fixes)  
**Input**: "서치모드가 종료되면 하이라이트도 없어져야함. 검색텍스트가 변경되면 하이라이트도 업데이트 되어야함 현재 몇번째 수정이 안되고 잇음"

---

## Executive Summary

현재 구현된 Find 기능에서 3가지 핵심 문제가 발견됨:

1. **검색 모드 종료 시 하이라이트가 남아있음** - 사용자가 Escape로 검색을 종료해도 노란색 하이라이트가 에디터에 계속 표시됨
2. **검색어 변경 시 하이라이트가 갱신되지 않음** - "hello"를 검색하다가 "world"로 변경해도 이전 하이라이트가 유지됨
3. **현재 매치 인덱스 표시가 업데이트되지 않음** - Next/Previous 버튼을 눌러도 "1 of 5" 표시가 변경되지 않음

### 근본 원인 분석 (Technical Deep Dive)

**현재 구현 방식의 문제점:**

- `SlateEditor.tsx`가 **Slate Marks**를 사용하여 하이라이트를 구현 (140-199줄)
- Marks는 **문서 모델에 영구적으로 저장되는** 포맷 속성 (bold, italic 등과 동일 레벨)
- `Editor.removeMark()`는 **현재 selection의 marks만 제거**함
- 현재 구현은 `Editor.marks(editor)`로 현재 커서 위치의 marks만 확인하므로, 문서의 다른 위치에 적용된 find marks는 제거되지 않음
- 결과: 검색 종료 시 커서 위치의 하이라이트만 제거되고 나머지는 문서에 영구히 남음

**Slate.js 공식 권장 방식:**

- **Decorations**를 사용 - 렌더 타임에만 적용되는 임시 포맷
- 문서 모델을 변경하지 않음
- 검색 상태가 변경되면 자동으로 re-render되며 하이라이트가 갱신됨

---

## User Scenarios & Testing

### User Story 1 - Clear highlights on search close (Priority: P1)

검색 모드를 종료하면 모든 하이라이트가 즉시 제거되어야 함.

**Why this priority**: 사용자 경험의 핵심 - 검색이 종료되었음을 시각적으로 명확히 전달해야 함.

**Current Bug**: Escape 키를 누르거나 X 버튼을 클릭해도 노란색 하이라이트가 에디터에 남아있음.

**Acceptance Scenarios**:

1. **Given** 검색바가 열려있고 "hello"를 검색하여 3개의 매치가 노란색으로 하이라이트됨, **When** Escape 키를 눌러 검색 모드를 종료함, **Then** 모든 노란색 하이라이트가 즉시 제거됨
2. **Given** 검색바가 열려있고 여러 매치가 하이라이트됨, **When** X 버튼을 클릭하여 검색바를 닫음, **Then** 모든 하이라이트가 제거됨
3. **Given** 검색바가 열려있고 활성 매치가 파란색으로 표시됨, **When** Cmd+F를 다시 눌러 검색바를 토글하여 닫음, **Then** 모든 하이라이트(노란색 + 파란색)가 제거됨

---

### User Story 2 - Update highlights on search text change (Priority: P1)

검색어를 수정하면 하이라이트가 실시간으로 업데이트되어야 함.

**Why this priority**: 사용자가 입력하는 동안 즉각적인 시각 피드백을 제공해야 함.

**Current Bug**: "hello"를 검색하여 하이라이트된 상태에서 "world"로 변경해도 이전 하이라이트가 유지됨.

**Acceptance Scenarios**:

1. **Given** "hello"가 검색되어 3개의 매치가 하이라이트됨, **When** 검색어를 "hell"로 수정함, **Then** 이전 하이라이트가 모두 제거되고 "hell" 매치만 하이라이트됨
2. **Given** "test"가 검색되어 하이라이트됨, **When** 검색어를 완전히 삭제하여 빈 문자열로 만듦, **Then** 모든 하이라이트가 즉시 제거됨
3. **Given** 검색어 입력 중, **When** 매 키 입력마다 검색어가 변경됨, **Then** 100ms 이내에 하이라이트가 갱신됨 (debounce 고려)

---

### User Story 3 - Update active match indicator on navigation (Priority: P1)

Next/Previous 버튼으로 매치를 탐색하면 "X of Y" 표시가 업데이트되어야 함.

**Why this priority**: 사용자가 현재 위치를 파악할 수 없으면 탐색이 무의미함.

**Current Bug**: Enter 키로 다음 매치로 이동해도 "1 of 5" 표시가 "2 of 5"로 변경되지 않음.

**Acceptance Scenarios**:

1. **Given** "hello"가 검색되어 5개의 매치가 발견되고 "1 of 5"가 표시됨, **When** Enter 키를 누름, **Then** 표시가 "2 of 5"로 변경되고 두 번째 매치가 파란색으로 강조됨
2. **Given** 현재 "3 of 5"가 표시됨, **When** Shift+Enter를 눌러 이전 매치로 이동함, **Then** 표시가 "2 of 5"로 변경됨
3. **Given** 현재 "5 of 5" (마지막 매치), **When** Enter를 눌러 다음으로 이동함, **Then** 표시가 "1 of 5"로 wrap-around됨

---

### Edge Cases

- IME 조합 중 검색어가 변경되는 경우 (한글 입력 중)
- 검색 중 에디터 내용이 수정되어 매치 개수가 변경되는 경우
- 매우 긴 문서(10,000줄+)에서 수천 개의 매치가 발견되는 경우
- 검색어와 일치하는 텍스트를 사용자가 직접 편집하는 경우

---

## Requirements

### Functional Requirements

**하이라이트 생명주기 (Critical):**

- **FR-001**: 검색 모드가 종료되면(`findState.isOpen === false`) 모든 검색 하이라이트가 즉시 제거되어야 함
- **FR-002**: 검색어가 변경되면(`findState.searchTerm` 변경) 이전 하이라이트가 완전히 제거되고 새 매치만 하이라이트되어야 함
- **FR-003**: 검색어가 빈 문자열이면 어떤 하이라이트도 표시하지 않아야 함

**하이라이트 렌더링 (Critical):**

- **FR-004**: 일반 매치는 노란색 배경(`rgba(255, 214, 0, 0.4)`)으로 표시되어야 함
- **FR-005**: 활성 매치(현재 선택된 매치)는 파란색 배경(`#007aff`)과 흰색 텍스트로 표시되어야 함
- **FR-006**: 하이라이트는 **Slate Decorations**를 사용하여 구현되어야 함 (Marks 사용 금지)

**매치 탐색 (Critical):**

- **FR-007**: `activeIndex`가 변경되면 해당 매치로 스크롤되고 활성 상태로 표시되어야 함
- **FR-008**: FindPanel의 매치 카운트 표시(`${activeIndex + 1} of ${totalMatches}`)가 실시간으로 업데이트되어야 함
- **FR-009**: 마지막 매치에서 Next를 누르면 첫 번째 매치로 wrap-around해야 함

**성능 요구사항:**

- **FR-010**: 검색어 입력은 100ms debounce를 적용하여 과도한 re-render를 방지해야 함
- **FR-011**: 10,000줄 문서에서 1,000개의 매치가 있을 때 하이라이트 렌더링이 200ms 이내에 완료되어야 함

### Non-Functional Requirements

- **NFR-001**: 기존 `useFind` 훅의 public API는 변경하지 않음 (호환성 유지)
- **NFR-002**: `findUtils.ts`의 검색 로직은 재사용함
- **NFR-003**: 기존 E2E 테스트(`e2e/editor-find.spec.ts`)는 모두 통과해야 함

### Key Entities

**FindState** (기존 유지):

```typescript
interface FindState {
  isOpen: boolean; // 검색바 열림/닫힘
  searchTerm: string; // 현재 검색어
  replaceTerm: string; // 교체 텍스트
  matches: SearchMatch[]; // 발견된 모든 매치
  activeIndex: number; // 현재 활성 매치 인덱스 (-1: 없음)
  isComposing: boolean; // IME 조합 중 여부
}
```

**SearchMatch** (기존 유지):

```typescript
interface SearchMatch {
  id: string; // 고유 ID (e.g., "match-0")
  start: number; // 절대 오프셋 (문서 전체 기준)
  end: number; // 절대 오프셋
  line: number; // 라인 번호 (0-based)
}
```

**Decoration Range** (새로 추가):

```typescript
// Slate.js BaseRange에 커스텀 속성 추가
interface CustomRange extends BaseRange {
  highlight?: boolean; // 일반 매치 하이라이트
  activeHighlight?: boolean; // 활성 매치 하이라이트
}
```

---

## Technical Implementation Plan

### 변경 대상 파일

1. **src/components/SlateEditor.tsx** (Major Refactor)
   - Marks 기반 하이라이트 제거 (139-199줄)
   - Decorations 기반 구현으로 교체
   - `decorate` callback 추가

2. **src/hooks/useFind.ts** (Minor Update)
   - `isComposing` 상태 처리 보강 (현재 미사용)

3. **src/App.tsx** (No Change)
   - FindPanel에 전달하는 props 확인만 수행

### 구현 단계

**Phase 1: SlateEditor Decoration 구현**

```typescript
// SlateEditor.tsx 내부
const decorate = useCallback(
  ([node, path]: NodeEntry): Range[] => {
    const ranges: Range[] = [];

    // 검색 상태가 없으면 빈 배열 반환 (하이라이트 없음)
    if (!findState?.searchTerm || findState.matches.length === 0) {
      return ranges;
    }

    // 현재 노드가 텍스트 노드인 경우에만 처리
    if (!Text.isText(node)) {
      return ranges;
    }

    // 현재 라인의 매치들을 필터링
    const lineIndex = path[0];
    const matchesInLine = findState.matches.filter((m) => m.line === lineIndex);

    // 라인 시작 오프셋 계산
    let lineStartOffset = 0;
    for (let i = 0; i < lineIndex; i++) {
      const lineNode = editor.children[i];
      if (SlateElement.isElement(lineNode)) {
        const lineText = Node.string(lineNode);
        lineStartOffset += lineText.length + 1; // +1 for newline
      }
    }

    // 각 매치에 대해 Range 생성
    matchesInLine.forEach((match, idx) => {
      const relativeStart = match.start - lineStartOffset;
      const relativeEnd = match.end - lineStartOffset;
      const isActive = findState.matches.indexOf(match) === findState.activeIndex;

      ranges.push({
        anchor: { path, offset: relativeStart },
        focus: { path, offset: relativeEnd },
        [isActive ? 'activeHighlight' : 'highlight']: true,
      });
    });

    return ranges;
  },
  [findState?.searchTerm, findState?.matches, findState?.activeIndex, editor.children]
);
```

**Phase 2: renderLeaf 업데이트**

```typescript
const renderLeaf = useCallback((props: RenderLeafProps) => {
  const { attributes, children, leaf } = props;

  let className = '';
  if (leaf.activeHighlight) {
    className = 'find-match-active';
  } else if (leaf.highlight) {
    className = 'find-match';
  }

  return (
    <span {...attributes} className={className}>
      {children}
    </span>
  );
}, []);
```

**Phase 3: Editable에 decorate 연결**

```typescript
<Editable
  decorate={decorate}
  renderLeaf={renderLeaf}
  // ... 기존 props
/>
```

**Phase 4: 기존 Marks 제거**

- 139-199줄의 `useEffect` (mark 적용 로직) 완전 삭제
- CustomText 타입에서 `'find-match'?` 및 `'find-active'?` 속성 제거

---

## Success Criteria

### Measurable Outcomes

**기능 검증:**

- **SC-001**: Escape 키로 검색 종료 시 100% 하이라이트 제거 (육안 확인 + E2E 테스트)
- **SC-002**: 검색어 변경 시 100ms 이내 하이라이트 갱신 (performance.now() 측정)
- **SC-003**: Next/Previous 버튼 클릭 시 "X of Y" 표시가 실시간 업데이트 (E2E 테스트)

**성능 검증:**

- **SC-004**: 10,000줄 문서, 1,000개 매치에서 하이라이트 렌더링 200ms 이내
- **SC-005**: 검색어 입력 시 debounce로 인한 지연이 100ms 미만으로 체감됨

**회귀 테스트:**

- **SC-006**: 기존 E2E 테스트 15개 케이스 모두 통과 (`e2e/editor-find.spec.ts`)
- **SC-007**: 기존 Unit 테스트 모두 통과 (`src/lib/findUtils.test.ts`)

### Assumptions

- Slate.js 버전은 현재 사용 중인 버전 유지 (package.json 확인 필요)
- Decorations API는 Slate 0.50+ 버전에서 안정적으로 동작함
- 사용자는 IME 조합 완료 후에만 검색이 실행되기를 기대함 (기존 동작 유지)

---

## Risk Analysis

### Technical Risks

| Risk                                                 | Impact | Mitigation                                                               |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Decorations 성능 이슈 (매 렌더마다 계산)             | High   | `useMemo`로 매치 목록을 pre-calculate, `decorate`는 단순 lookup만 수행   |
| Cross-node 매치 처리 (매치가 두 줄에 걸쳐 있는 경우) | Medium | 현재 구현도 동일 제약 - 개행 문자 포함 검색은 지원하지 않음으로 명시     |
| IME 조합 중 하이라이트 깜빡임                        | Low    | `isComposing` 상태를 `decorate` 의존성에 포함하여 조합 중 re-render 방지 |

### User Experience Risks

| Risk                                     | Impact | Mitigation                                            |
| ---------------------------------------- | ------ | ----------------------------------------------------- |
| 하이라이트가 너무 많아 화면이 혼란스러움 | Medium | CSS로 subtle한 색상 사용, 최대 매치 수 제한 추가 고려 |
| 활성 매치로 스크롤 시 너무 빠르게 이동   | Low    | `scrollIntoView({ behavior: 'smooth' })` 유지         |

---

## Testing Strategy

### Unit Tests (신규 추가)

```typescript
// SlateEditor.test.tsx (신규 파일)
describe('SlateEditor Find Decorations', () => {
  it('should return empty ranges when findState is null', () => {
    // decorate 함수 단독 테스트
  });

  it('should generate highlight ranges for matches', () => {
    // 매치가 있을 때 Range[] 생성 검증
  });

  it('should mark active match with activeHighlight', () => {
    // activeIndex에 해당하는 매치만 activeHighlight 속성 가짐
  });
});
```

### E2E Tests (기존 확장)

```typescript
// e2e/editor-find.spec.ts
test('F-041: 검색 종료 시 하이라이트 제거', async ({ page }) => {
  await editor.type('hello world hello');
  await page.keyboard.press('Meta+f');
  await page.keyboard.type('hello');

  // 하이라이트 확인
  const highlights = page.locator('.find-match');
  await expect(highlights).toHaveCount(2);

  // 검색 종료
  await page.keyboard.press('Escape');

  // 하이라이트 완전 제거 확인
  await expect(highlights).toHaveCount(0);
});

test('F-042: 검색어 변경 시 하이라이트 갱신', async ({ page }) => {
  await editor.type('hello world test');
  await page.keyboard.press('Meta+f');
  await page.keyboard.type('hello');

  let highlights = page.locator('.find-match');
  await expect(highlights).toHaveCount(1);

  // 검색어 변경
  await page.keyboard.press('Meta+a'); // 전체 선택
  await page.keyboard.type('world');

  // 새 하이라이트 확인
  highlights = page.locator('.find-match');
  await expect(highlights).toHaveCount(1);
  // TODO: 하이라이트된 텍스트가 "world"인지 확인
});
```

---

## Appendix

### 현재 구현 분석 (Codebase Archaeology)

**파일 구조:**

```
src/
├── hooks/useFind.ts           # 검색 상태 관리 (199줄)
├── components/
│   ├── FindPanel.tsx          # 검색 UI (255줄)
│   └── SlateEditor.tsx        # 에디터 + 하이라이트 (565줄)
├── lib/
│   ├── findUtils.ts           # 검색 로직 (166줄)
│   └── findUtils.test.ts      # 단위 테스트 (251줄)
└── types/find.ts              # 타입 정의 (53줄)
```

**현재 하이라이트 적용 플로우:**

1. `FindPanel`에서 사용자가 "hello" 입력
2. `useFind.setSearchTerm("hello")` 호출
3. Debounce 100ms 후 `findMatches(documentText, "hello")` 실행
4. `SearchMatch[]` 생성 (start/end/line 포함)
5. `findState.matches` 업데이트
6. `SlateEditor`의 `useEffect` 감지 (199줄)
7. **문제 지점**: `Editor.addMark()` 호출하여 문서에 영구 마크 추가
8. `renderLeaf`에서 마크 기반으로 CSS 클래스 적용

**Marks vs Decorations 비교:**

| Aspect    | Marks (현재)                 | Decorations (목표)        |
| --------- | ---------------------------- | ------------------------- |
| 저장 위치 | 문서 모델에 영구 저장        | 메모리, 렌더 타임만       |
| 제거 방법 | Selection 이동 후 removeMark | 상태 변경만으로 자동 제거 |
| 성능      | Transform 연산 필요 (느림)   | Pure function (빠름)      |
| 부작용    | Undo/Redo 히스토리에 기록됨  | 부작용 없음               |

### References

- Slate.js Official Docs: [Decorations](https://docs.slatejs.org/concepts/09-rendering#decorations)
- Slate.js Example: [search-highlighting.tsx](https://github.com/ianstormtaylor/slate/blob/main/site/examples/ts/search-highlighting.tsx)
- Boop2 Spec 006: [Editor Find Functionality](../006-editor-find/spec.md)
- Boop2 Spec 007: [Find Highlight Synchronization](../007-find-highlight-sync/spec.md)
