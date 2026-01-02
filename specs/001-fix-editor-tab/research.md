# Research: 에디터 탭 키 입력 지원

**Date**: 2026-01-02
**Feature**: 001-fix-editor-tab

## 1. Slate.js Tab 키 처리 패턴

### Decision
`handleKeyDown` 콜백에서 `event.key === 'Tab'` 조건으로 처리하고, `event.preventDefault()`로 브라우저 기본 동작(포커스 이동)을 방지한다.

### Rationale
Slate.js 공식 문서의 이벤트 핸들링 패턴을 따름:
1. `onKeyDown` 이벤트에서 특수 키 감지
2. `event.preventDefault()` 호출로 기본 동작 방지
3. `editor.insertText()` 또는 `Transforms` API로 텍스트 조작

### Alternatives Considered
- **Slate Plugin 패턴**: 별도 플러그인으로 분리 가능하나, 단순 기능에 과도한 추상화
- **beforeinput 이벤트**: Tab은 beforeinput으로 감지되지 않음 (키보드 탐색 키)

### Code Pattern
```typescript
const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    if (event.shiftKey) {
      // Shift+Tab: 내어쓰기
    } else {
      // Tab: 들여쓰기
    }
  }
};
```

## 2. 들여쓰기 삽입 방식

### Decision
`Transforms.insertText(editor, '    ')` (4개 공백)을 사용한다.

### Rationale
- `editor.insertText()`는 현재 선택 위치에 텍스트를 삽입
- 탭 문자(`\t`) 대신 공백 사용: 폰트/렌더링에 따른 너비 불일치 방지
- 4개 공백은 대부분의 코드 에디터 기본값

### Alternatives Considered
- **탭 문자 삽입**: 렌더링 일관성 문제 (모노스페이스 폰트에서도 탭 너비가 다름)
- **2개 공백**: 일부 스타일 가이드에서 선호하나, 4개가 더 보편적

## 3. 내어쓰기 (Shift+Tab) 구현

### Decision
현재 줄 시작에서 최대 4개의 공백을 제거한다. `Transforms.delete()`와 `Editor.start()`를 조합.

### Rationale
- 줄 시작 위치(`Editor.start(editor, path)`)에서 공백 개수 확인
- 있는 공백만큼만 제거 (4개 미만이면 있는 것만)
- 커서 위치와 무관하게 줄 시작에서 처리

### Implementation Approach
```typescript
const lineStart = Editor.start(editor, path);
const lineText = Node.string(node);
const leadingSpaces = lineText.match(/^( {1,4})/)?.[1].length || 0;
if (leadingSpaces > 0) {
  Transforms.delete(editor, {
    at: { anchor: lineStart, focus: { ...lineStart, offset: leadingSpaces } }
  });
}
```

## 4. 여러 줄 선택 시 처리

### Decision
선택된 모든 줄에 대해 반복 처리. 선택 범위에 포함된 줄을 추출하여 각각 들여쓰기/내어쓰기 적용.

### Rationale
- `Range.isCollapsed()` 체크로 단일 커서 vs 선택 구분
- 선택 시 각 줄의 시작 부분에 공백 삽입/제거
- 선택 영역은 유지 (들여쓰기 후에도 같은 줄들이 선택된 상태)

### Implementation Approach
```typescript
if (!Range.isCollapsed(selection)) {
  const [start, end] = Range.edges(selection);
  const startLine = start.path[0];
  const endLine = end.path[0];
  for (let i = startLine; i <= endLine; i++) {
    // 각 줄에 들여쓰기/내어쓰기 적용
  }
}
```

## 5. Undo/Redo 호환성

### Decision
Slate의 기본 히스토리 시스템 활용. 별도 처리 불필요.

### Rationale
- `withHistory()` 플러그인이 이미 적용됨 (`SlateEditor.tsx:100`)
- `Transforms.insertText()`와 `Transforms.delete()`는 자동으로 히스토리에 기록됨
- 여러 줄 처리도 단일 Undo로 되돌릴 수 있도록 하나의 배치로 실행

## 6. 기존 코드 분석

### Current State (SlateEditor.tsx:302-314)
```typescript
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter 키: 새 paragraph 생성
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      Editor.insertBreak(editor);
      return;
    }
  },
  [editor]
);
```

### Required Changes
1. `if (event.key === 'Tab')` 블록 추가
2. 단일 줄 vs 여러 줄 분기 처리
3. `event.shiftKey`로 들여쓰기/내어쓰기 구분

## 7. 성능 고려사항

### Decision
동기 처리로 충분. Worker 사용 불필요.

### Rationale
- Tab 삽입은 O(1) 연산
- 여러 줄 처리도 줄 수에 비례하는 O(n)이며, 일반적으로 100줄 미만
- 1000줄 선택 시에도 100ms 미만 예상 (Slate의 내부 최적화)

### Performance Test
구현 후 1000줄 텍스트에서 성능 측정 필요. 100ms 초과 시 청킹 고려.

## Summary

| 항목 | 결정 |
|------|------|
| 이벤트 처리 | handleKeyDown + event.preventDefault() |
| 들여쓰기 단위 | 4개 공백 |
| 삽입 API | Transforms.insertText() |
| 삭제 API | Transforms.delete() |
| 히스토리 | 기본 slate-history 활용 |
| 성능 | 동기 처리, Worker 불필요 |
