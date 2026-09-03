# 파일/폴더 컨텍스트 메뉴: 이름 변경 · 삭제

작성일: 2026-06-21

## 목적

프로젝트 파일 트리(`FilesTree`)의 파일/폴더 행에서 컨텍스트 메뉴를 통해 **이름 변경**과
**삭제**를 할 수 있게 한다. 현재 트리는 열기/토글/드래그 이동만 지원하며, 이름 변경·삭제
수단이 없다.

## 사용자 결정 사항

- **메뉴 트리거**: 행 우클릭(`onContextMenu`). 좌클릭의 기존 동작(파일 열기/폴더 토글)은
  그대로 유지한다.
- **이름 변경 UX**: 트리 내 인라인 편집(VS Code 방식). 행의 이름이 입력 필드로 바뀐다.
- **삭제 동작**: 확인 다이얼로그 후 OS 휴지통으로 이동(복구 가능).

## 범위

- 메뉴 항목은 **이름 변경**, **삭제** 두 개만 추가한다. (Copy Path / Reveal in Finder 등은
  이번 범위에서 제외.)
- 프로젝트 패널(`ProjectPanel`)의 기존 우클릭 메뉴는 변경하지 않는다.

## 아키텍처

### 1. 백엔드 (Rust, `src-tauri/src/lib.rs`)

기존 파일 커맨드(`create_project_file`, `move_project_entry` 등)와 동일한 스타일로 두 커맨드를
추가하고 `invoke_handler`에 등록한다.

#### `rename_project_entry(source_path: String, new_name: String) -> Result<ProjectFileNode, String>`

- `source_path` 존재 확인. 없으면 `"Project entry source does not exist"`.
- `new_name` 검증:
  - 빈 문자열/공백만 → 에러 `"Invalid name"`.
  - 경로 구분자 포함(`/`, `\`) 또는 `.`, `..` → 에러 `"Invalid name"`.
- 대상 경로 = `source.parent().join(new_name)`.
- 대상이 이미 존재하면(소스 자신과 canonical 동일한 경우 제외) → 에러
  `"Destination already exists"`. (`move_project_entry`의 기존 검사 패턴 재사용.)
- `fs::rename(source, destination)` 수행 후 `project_file_node(&destination)` 반환.

#### `delete_project_entry(path: String) -> Result<(), String>`

- `path` 존재 확인. 없으면 `"Project entry does not exist"`.
- `trash::delete(&path)`로 OS 휴지통 이동. 실패 시 에러 문자열 반환.
- 의존성: `Cargo.toml`에 `trash = "5"` 추가(크로스플랫폼: macOS/Windows/Linux 지원).

#### 테스트

- `rename_project_entry`: 성공(파일 이름 변경), 대상 이미 존재 시 거부, 잘못된 이름 거부 —
  임시 디렉터리 기반, 기존 테스트 헬퍼(`temporary_project_dir`) 재사용.
- `delete_project_entry`: 존재하지 않는 경로에 대한 에러 경로만 테스트한다. (실제 휴지통 이동은
  개발 머신의 휴지통을 오염시키는 부작용이 있어 유닛 테스트에서 수행하지 않는다.)

### 2. 클라이언트 타입/구현

#### `src/app/projectFileTypes.ts`

`ProjectFileClient`에 추가:

```ts
renameProjectEntry: (sourcePath: string, newName: string) => Promise<ProjectFileNode>;
deleteProjectEntry: (path: string) => Promise<void>;
```

#### `src/app/projectFileClient.ts`

- `renameProjectEntry`: `invoke('rename_project_entry', { sourcePath, newName })` →
  `normalizeBackendProjectFileNode`.
- `deleteProjectEntry`: `invoke('delete_project_entry', { path })`.

### 3. 워크스페이스 상태 (`src/app/useProjectWorkspace.ts`)

`UseProjectWorkspaceResult`에 `renameEntry`, `deleteEntry`를 추가한다.

#### `renameEntry(node: ProjectFileNode, newName: string) => Promise<ProjectFileNode | undefined>`

- `client.renameProjectEntry(node.path, newName)` 호출.
- 부모 폴더 갱신(`refreshCreationParent(parentPath)` 재사용 — 루트면 루트 새로고침).
- 열린 탭/선택 경로/활성 탭 ID를 새 경로로 갱신한다. rename은 경로 이동과 동등하므로 기존
  `getMovedPath(candidate, node.path, movedNode.path)` 헬퍼를 그대로 재사용한다.
  (`moveEntry`의 탭/선택 갱신 로직과 동일.)

부모 경로는 `node.path`에서 마지막 세그먼트를 제거해 얻는다. 기존
`normalizeProjectPath`로 정규화 후 마지막 `/` 기준 분리.

#### `deleteEntry(node: ProjectFileNode) => Promise<void>`

- `client.deleteProjectEntry(node.path)` 호출.
- 부모 폴더 갱신.
- 삭제된 노드 자신 또는 그 하위 경로에 해당하는 열린 탭을 모두 닫는다
  (`isSameOrDescendantPath` 재사용). 활성 탭이 닫히면 활성 탭/선택을 해제한다.
- 선택된 파일/폴더 경로가 삭제 대상이거나 하위면 해제한다.

### 4. 컨텍스트 메뉴 + 인라인 편집 (`src/App.tsx`, `src/app/FilesTree.tsx`)

#### `ShellContextMenu` 타입 확장 (`App.tsx`)

```ts
type ShellContextMenu =
  | { kind: 'project'; project: ProjectEntry; position: { x: number; y: number } }
  | { kind: 'entry'; node: ProjectFileNode; position: { x: number; y: number } };
```

`ContextMenu` 렌더링부에서 `contextMenu.kind`로 분기해 항목을 선택한다.

#### 메뉴 항목 (`App.tsx`)

`getEntryContextMenuItems(node)`:

- **이름 변경(Rename)**: `setRenamingPath(node.path)` 후 메뉴 닫기.
- **삭제(Delete)**: `@tauri-apps/plugin-dialog`의 `ask`로 네이티브 확인
  (예: 메시지 `"\"{name}\"을(를) 휴지통으로 이동할까요?"`, 제목 `"삭제 확인"`). 확인 시
  `handleDeleteEntry(node)` 호출, 성공/실패를 `status`에 반영.

#### 인라인 편집 상태 (`App.tsx`)

- 신규 상태 `renamingPath: string | undefined`.
- `FilesTree`에 prop으로 전달: `renamingPath`, `onRenameSubmit(node, newName)`,
  `onRenameCancel()`, `onOpenEntryMenu(node, position)`.
- `onRenameSubmit`: 빈 값이거나 기존 이름과 동일하면 편집만 종료. 아니면
  `renameEntry` 호출 후 상태/`renamingPath` 정리, 결과를 `status`에 반영.

#### `FilesTree.tsx` 변경

- `FilesTreeProps`에 추가: `renamingPath?`, `onOpenEntryMenu`, `onRenameSubmit`,
  `onRenameCancel`. `TreeRows`로 전달.
- 각 행(파일/폴더)에 `onContextMenu` 핸들러 추가: `event.preventDefault()` 후
  `onOpenEntryMenu(node, { x: event.clientX, y: event.clientY })`.
- `renamingPath === node.path`인 행은 이름(`FolderName`/`FileName`) 대신 `<input>` 렌더:
  - 초기값 = `node.name`, 마운트 시 자동 포커스(파일은 확장자 앞 stem만 select 권장).
  - Enter → `onRenameSubmit(node, value)`, Escape → `onRenameCancel()`, blur → submit.
  - 편집 중 행의 `onClick`/`onKeyDown`/`onPointerDown`(드래그) 동작을 억제한다
    (input에서 이벤트 `stopPropagation`).

## 데이터 흐름

1. 우클릭 → `FilesTree.onContextMenu` → `App.onOpenEntryMenu` → `setContextMenu({kind:'entry',...})`.
2. 메뉴 "이름 변경" → `setRenamingPath(node.path)` → 해당 행이 input으로 렌더 →
   확정 시 `onRenameSubmit` → `renameEntry` → 백엔드 `rename_project_entry` → 트리/탭 갱신.
3. 메뉴 "삭제" → `ask` 확인 → `handleDeleteEntry` → `deleteEntry` → 백엔드
   `delete_project_entry`(휴지통) → 트리/탭 갱신.

## 에러 처리

- 백엔드 커맨드는 `Result<_, String>`로 사용자 표시용 메시지를 반환. 프런트는 try/catch로
  `status`(error)에 반영(기존 `handleCreateFile` 등과 동일 패턴).
- 이름 변경 충돌("Destination already exists")·잘못된 이름은 상태 메시지로 노출하고 편집을
  유지하거나 종료(구현 시 단순화: 에러 시 메시지 노출 후 편집 종료).

## 테스트 전략

- **Rust**: 위 백엔드 테스트.
- **useProjectWorkspace.test.tsx**: 목 클라이언트에 `renameProjectEntry`,
  `deleteProjectEntry` 추가. `renameEntry`가 탭/선택 경로를 갱신하는지, `deleteEntry`가
  삭제 대상 탭을 닫는지 검증.
- **FilesTree.test.tsx**: 우클릭이 `onOpenEntryMenu`를 호출하는지, `renamingPath` 설정 시
  input이 렌더되고 Enter/Escape가 submit/cancel을 호출하는지 검증.

## 영향 파일

- `src-tauri/Cargo.toml` (trash 의존성)
- `src-tauri/src/lib.rs` (커맨드 2개 + 등록 + 테스트)
- `src/app/projectFileTypes.ts`
- `src/app/projectFileClient.ts`
- `src/app/useProjectWorkspace.ts` (+ 테스트)
- `src/app/FilesTree.tsx` (+ 테스트)
- `src/App.tsx`
- `src/app/FilesTree.css` (인라인 input 스타일 — 필요 시)
