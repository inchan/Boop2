# Quickstart: Fix Tab-Specific Undo History

**Date**: 2025-01-05
**Feature**: 010-fix-tab-undo

## 요약

탭별 독립적인 Undo/Redo 히스토리를 구현하기 위해 탭별 Slate 에디터 인스턴스를 관리합니다.

## 주요 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/App.tsx` | 탭별 에디터 인스턴스 맵 관리, 탭 닫기 시 정리 |
| `src/components/SlateEditor.tsx` | editor prop 수신, 내부 생성 코드 제거 |

## 핵심 변경 사항

### 1. App.tsx - 에디터 인스턴스 관리

```typescript
import { createEditor, Editor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';

// 탭별 에디터 인스턴스 맵
const editorsRef = useRef<Map<string, Editor>>(new Map());

// 에디터 인스턴스 생성/조회
const getOrCreateEditor = useCallback((tabId: string) => {
  if (!editorsRef.current.has(tabId)) {
    editorsRef.current.set(tabId, withReact(withHistory(createEditor())));
  }
  return editorsRef.current.get(tabId)!;
}, []);

// 탭 닫기 시 에디터 정리
const handleCloseTab = useCallback((id: string) => {
  editorsRef.current.delete(id);  // 메모리 정리
  // ... 기존 로직
}, [...]);
```

### 2. SlateEditor.tsx - editor prop 수신

```typescript
interface SlateEditorProps {
  editor: Editor;  // 필수 prop으로 변경
  initialValue?: string;
  onChange?: (value: string) => void;
  // ...
}

const SlateEditor = forwardRef<SlateEditorHandle, SlateEditorProps>(
  ({ editor, initialValue = '', onChange, ... }, ref) => {
    // useState(() => withReact(withHistory(createEditor()))) 제거
    // 외부에서 받은 editor 사용
  }
);
```

### 3. 에디터 전달

```tsx
// App.tsx
<SlateEditor
  editor={getOrCreateEditor(activeTabId)}
  initialValue={activeTab?.content || ''}
  onChange={handleEditorChange}
  // ...
/>
```

## 테스트 명령어

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 린트 확인
npm run lint
```

## 검증 체크리스트

- [ ] 탭 1에서 텍스트 입력 후 탭 2에서 Cmd+Z → 탭 1 변경 없음
- [ ] 탭 전환 후 돌아와서 Cmd+Z → 해당 탭 히스토리 정상 작동
- [ ] 탭 닫기 후 메모리 누수 없음 (DevTools에서 확인)
- [ ] 5개 탭 시나리오에서 각 탭 히스토리 독립 유지
