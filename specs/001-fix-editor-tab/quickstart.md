# Quickstart: 에디터 탭 키 입력 지원

**Feature**: 001-fix-editor-tab
**Target File**: `src/components/SlateEditor.tsx`

## 기능 개요

에디터에서 Tab 키를 누르면 4개의 공백이 삽입되고, Shift+Tab을 누르면 줄 시작의 들여쓰기가 제거됩니다.

## 구현 위치

### 수정 파일

`src/components/SlateEditor.tsx` - `handleKeyDown` 함수 확장

현재 코드 (302-314행):
```typescript
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      Editor.insertBreak(editor);
      return;
    }
  },
  [editor]
);
```

### 추가할 로직

```typescript
// Tab 키 처리 추가
if (event.key === 'Tab') {
  event.preventDefault();

  const { selection } = editor;
  if (!selection) return;

  if (event.shiftKey) {
    // Shift+Tab: 내어쓰기
    handleOutdent(editor, selection);
  } else {
    // Tab: 들여쓰기
    handleIndent(editor, selection);
  }
  return;
}
```

## 핵심 로직

### 들여쓰기 (Tab)

```typescript
const INDENT = '    '; // 4 spaces

function handleIndent(editor: Editor, selection: Range) {
  if (Range.isCollapsed(selection)) {
    // 단일 커서: 현재 위치에 4 공백 삽입
    Transforms.insertText(editor, INDENT);
  } else {
    // 여러 줄 선택: 각 줄 시작에 4 공백 삽입
    const [start, end] = Range.edges(selection);
    for (let i = start.path[0]; i <= end.path[0]; i++) {
      Transforms.insertText(editor, INDENT, { at: Editor.start(editor, [i]) });
    }
  }
}
```

### 내어쓰기 (Shift+Tab)

```typescript
function handleOutdent(editor: Editor, selection: Range) {
  const [start, end] = Range.edges(selection);
  const startLine = start.path[0];
  const endLine = Range.isCollapsed(selection) ? startLine : end.path[0];

  for (let i = startLine; i <= endLine; i++) {
    const node = editor.children[i];
    const text = Node.string(node);
    const match = text.match(/^( {1,4})/);

    if (match) {
      const spacesToRemove = match[1].length;
      const lineStart = Editor.start(editor, [i]);
      Transforms.delete(editor, {
        at: {
          anchor: lineStart,
          focus: { ...lineStart, offset: spacesToRemove }
        }
      });
    }
  }
}
```

## 테스트 시나리오

### 수동 테스트

1. **기본 Tab 삽입**
   - 에디터에 텍스트 입력
   - 커서를 텍스트 중간에 위치
   - Tab 키 누름
   - 예상: 4개 공백 삽입, 커서 이동

2. **Shift+Tab 내어쓰기**
   - `    hello` (앞에 4공백) 입력
   - 커서 위치 무관하게 Shift+Tab 누름
   - 예상: 앞의 4공백 제거

3. **여러 줄 선택 들여쓰기**
   - 3줄 선택
   - Tab 누름
   - 예상: 3줄 모두 4공백 추가

4. **포커스 유지 확인**
   - Tab 누른 후 에디터 포커스 확인
   - 예상: 포커스 유지됨 (다른 요소로 이동 안 함)

### 자동 테스트

`tests/components/SlateEditor.test.tsx`에 추가:

```typescript
describe('Tab key handling', () => {
  it('inserts 4 spaces on Tab', () => {
    // Tab 키 이벤트 시뮬레이션
    // 텍스트에 4 공백 삽입 확인
  });

  it('removes leading spaces on Shift+Tab', () => {
    // Shift+Tab 이벤트 시뮬레이션
    // 줄 시작 공백 제거 확인
  });

  it('indents multiple lines on selection + Tab', () => {
    // 여러 줄 선택 후 Tab
    // 모든 줄에 4 공백 추가 확인
  });
});
```

## 추가 Import 필요

```typescript
import { Range, Node } from 'slate';  // 기존 import에 Range, Node 추가
```

## 체크리스트

- [ ] handleKeyDown에 Tab 키 처리 추가
- [ ] 단일 커서 들여쓰기 구현
- [ ] Shift+Tab 내어쓰기 구현
- [ ] 여러 줄 선택 들여쓰기 구현
- [ ] 여러 줄 선택 내어쓰기 구현
- [ ] 단위 테스트 추가
- [ ] E2E 테스트 추가 (선택사항)
