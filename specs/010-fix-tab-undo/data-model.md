# Data Model: Fix Tab-Specific Undo History

**Date**: 2025-01-05
**Feature**: 010-fix-tab-undo

## Entities

### Tab (기존)

개별 편집 세션을 나타냄.

```typescript
interface Tab {
  id: string;           // 고유 식별자
  content: string;      // 텍스트 콘텐츠
  // Note: editor 인스턴스는 Tab 인터페이스에 포함하지 않음
  //       별도 Map으로 관리 (editorsRef)
}
```

### Editor Instance Map (신규)

탭별 Slate 에디터 인스턴스를 관리하는 맵.

```typescript
// App.tsx에서 useRef로 관리
type EditorMap = Map<string, CustomEditor>;

// CustomEditor는 기존 SlateEditor.tsx에 정의됨
type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;
```

### History (Slate.js 내장)

에디터의 Undo/Redo 스택. Slate-history에서 제공.

```typescript
interface History {
  undos: Batch[];  // Undo 작업 스택
  redos: Batch[];  // Redo 작업 스택
}

interface Batch {
  operations: Operation[];      // 그룹화된 편집 작업들
  selectionBefore: Range | null; // 작업 전 선택 범위
}
```

## Relationships

```
┌─────────────┐     1:1      ┌─────────────────┐
│    Tab      │─────────────▶│ Editor Instance │
│   (id)      │              │  (Map 키로 연결)  │
└─────────────┘              └─────────────────┘
                                     │
                                     │ contains
                                     ▼
                             ┌─────────────────┐
                             │    History      │
                             │  (undos/redos)  │
                             └─────────────────┘
```

## State Transitions

### Tab Lifecycle

```
[생성] ──▶ [활성] ──▶ [비활성] ──▶ [닫힘]
   │         │           │           │
   │         │           │           │
   ▼         ▼           ▼           ▼
Editor    히스토리      히스토리    Editor
생성      유지/갱신     보존        정리
```

### Editor Instance Lifecycle

1. **생성**: 탭 최초 활성화 시 (getOrCreateEditor)
2. **사용**: 탭 활성 상태에서 편집
3. **유휴**: 다른 탭 활성화 (인스턴스 유지, 히스토리 보존)
4. **정리**: 탭 닫기 시 Map에서 삭제

## Validation Rules

1. **Editor-Tab 매핑**: 각 탭 ID는 최대 하나의 에디터 인스턴스와 매핑
2. **히스토리 깊이**: 탭당 최대 100개의 undo 배치 (Slate 기본값)
3. **정리 필수**: 탭 닫기 시 반드시 에디터 인스턴스 삭제

## Memory Considerations

| 항목 | 예상 크기 | 비고 |
|------|----------|------|
| Editor 인스턴스 | ~100KB | 빈 에디터 기준 |
| History (100 batches) | ~500KB | 작업 복잡도에 따라 변동 |
| 10개 탭 최대 | ~6MB | 모든 탭 활발히 사용 시 |

메모리 사용량은 허용 범위 내로 추가 최적화 불필요.
