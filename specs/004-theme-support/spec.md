# Feature Specification: 테마 지원 (Theme Support)

**Feature Branch**: `004-theme-support`  
**Created**: 2026-01-05  
**Status**: Draft  
**Input**: User description: "테마 지원 구현: 시스템 다크/라이트 모드에 따라 앱 UI가 자동으로 테마를 전환하도록 한다. 초기 로딩 시 흰화면이 보이는 문제를 해결한다."

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 시스템 다크 모드에서 앱이 다크 테마로 자동 전환 (Priority: P1)

사용자가 macOS 시스템 테마를 다크 모드로 설정한 후 Boop2 앱을 실행하면, 앱 UI가 자동으로 다크 테마로 표시된다. 시스템 테마가 라이트 모드로 변경되면 앱도 즉시 라이트 테마로 전환된다.

**Why this priority**: 이 기능은 다크 모드를 선호하는 사용자가 밝은 화면으로 인한 눈의 피로를 겪지 않도록 하는 핵심 사용성 개선 사항이다. macOS 생태계에서 다크 모드는 표준이므로, 지원하지 않으면 사용자 경험이 크게 저하된다.

**Independent Test**: macOS 시스템 환경설정에서 다크/라이트 모드를 전환하면서 앱 UI 색상이 올바르게 변경되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** macOS 시스템이 라이트 모드인 상태에서 Boop2 앱을 실행, **When** 사용자가 앱 윈도우를 연 상태에서 시스템 테마를 다크로 변경, **Then** 앱의 배경색, 텍스트 색상, 에디터 영역이 5초 이내에 다크 테마로 전환된다.

2. **Given** macOS 시스템이 다크 모드인 상태에서 Boop2 앱을 실행, **When** 사용자가 시스템 테마를 라이트로 변경, **Then** 앱의 모든 UI 요소가 라이트 테마로 즉시 전환된다.

3. **Given** Boop2 앱이 실행 중인 상태에서, **When** 사용자가 시스템 테마를 변경하지 않고 계속 사용, **Then** 앱 테마는 변경되지 않고 현재 상태를 유지한다.

---

### User Story 2 - 초기 로딩 시 흰화면 플래시 해결 (Priority: P1)

사용자가 Boop2 앱을 실행하면, HTML이 로딩되는 순간부터 시스템 테마에 맞는 배경색이 즉시 적용되어 흰색 또는 불필요한 깜빡임이 발생하지 않는다.

**Why this priority**: 초기 로딩 시 발생하는 흰화면은 사용자 경험에 부정적인 영향을 미친다. 특히 다크 모드에서 흰화면이 순간적으로 보이는 현상은 앱의 완성도가 낮아 보이게 만든다.

**Independent Test**: 앱을 여러 번 새로 시작하면서 초기 로딩 화면의 배경색이 시스템 테마와 일치하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** macOS 시스템이 다크 모드인 상태에서, **When** 사용자가 Boop2 앱을 실행, **Then** 앱 윈도우가 처음 나타나는 순간부터 배경이 어두운 색(#1e1e1e 또는 유사한 다크색)이어야 하며, 흰색이 순간적으로 보이지 않아야 한다.

2. **Given** macOS 시스템이 라이트 모드인 상태에서, **When** 사용자가 Boop2 앱을 실행, **Then** 앱 윈도우가 처음 나타나는 순간부터 배경이 밝은 색(#ffffff 또는 유사한 라이트색)이어야 하며, 다크색이 순간적으로 보이지 않아야 한다.

---

### User Story 3 - 주요 UI 요소들의 테마 적용 (Priority: P2)

앱의 모든 시각적 요소(탭바, 에디터, 상태바, 스크롤바, 팝업 메뉴 등)가 시스템 테마에 맞게 적절한 색상으로 표시된다.

**Why this priority**: 일관된 테마 적용은 앱의 전문적인 인상을 유지하는 데 필수적이다. 일부 요소만 테마가 적용되면 사용자에게 불완전한 느낌을 준다.

**Independent Test**: 시스템 테마를 변경하면서 앱의 모든 UI 요소가 올바르게 테마 변경에 반응하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** Boop2 앱이 실행 중인 상태에서, **When** 시스템 테마가 변경, **Then** 탭바의 배경색, 텍스트 색상, 활성화 탭 하이라이트가 테마에 맞게 변경된다.

2. **Given** Boop2 앱이 실행 중인 상태에서, **When** 시스템 테마가 변경, **Then** 에디터 영역의 배경색과 텍스트 색상이 테마에 맞게 변경되어 가독성이 유지된다.

3. **Given** Boop2 앱이 실행 중인 상태에서, **When** 시스템 테마가 변경, **Then** 상태바, 스크롤바, 커맨드 팔레트, 세션/클립보드/설정 팝업의 색상 모두가 테마에 맞게 변경된다.

---

### User Story 4 - 테마 전환 시 부드러운 전이 효과 (Priority: P3)

테마가 변경될 때 갑작스러운 색상 전환이 아닌, 부드러운 모션을 통해 색상이 자연스럽게 변경된다.

**Why this priority**: 테마 전환 시 부드러운 애니메이션은 사용자 경험의 완성도를 높인다. 이는 선택적 기능이므로 P3 우선순위로 설정한다.

**Independent Test**: 시스템 테마를 변경하면서 색상 전환이 부드럽게 애니메이션되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** Boop2 앱이 실행 중인 상태에서, **When** 시스템 테마가 변경, **Then** 모든 UI 요소의 색상 변경이 0.3초 이내에 동시에 이루어지며, 갑작스러운 색상 변화가 발생하지 않는다.

---

### Edge Cases

- 사용자가 macOS에서 특정 앱만 별도의 테마 모드로 설정하는 경우 (Boop2가 해당 예외를 적절히 처리해야 하는가?)
- 시스템 테마 변경 시점에 앱이 포커스를 잃은 상태인 경우 (백그라운드에서 테마 변경 후 포그라운드로 돌아올 때 올바르게 적용되어야 하는가?)
- 사용자가 수동으로 테마를 오버라이드할 수 있는 옵션이 필요한가? (이 스펙에서는 시스템 테마 자동 감지만 다룬다)
- 고대비 모드(Accessibility)와의 호환성은 어떻게 처리하는가?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 시스템 MUST macOS의 `prefers-color-scheme` 미디어 쿼리를 통해 현재 시스템 테마(다크/라이트)를 감지한다.
- **FR-002**: 앱 MUST 시스템 테마가 변경될 때 자동으로 UI 색상을 업데이트한다.
- **FR-003**: 앱 MUST 초기 HTML 로딩 시 시스템 테마에 맞는 배경색이 즉시 적용되어 흰화면 플래시가 발생하지 않도록 한다.
- **FR-004**: 앱 MUST 다음 UI 요소들에 대해 테마별 색상을 정의하고 적용한다:
  - 메인 배경색
  - 에디터 배경색 및 텍스트 색상
  - 탭바 배경색 및 텍스트 색상
  - 상태바 배경색 및 텍스트 색상
  - 스크롤바 색상
  - 팝업 메뉴(클립보드, 세션, 설정) 배경색 및 텍스트 색상
  - 커맨드 팔레트 배경색 및 항목 하이라이트 색상
- **FR-005**: 테마 전환 시 MUST 모든 UI 요소에 동시에 부드러운 색상 전이 애니메이션이 적용된다 (0.3초 이하). Reduced Motion 접근성 설정이 활성화된 경우 애니메이션은 비활성화된다.
- **FR-006**: 색상 값 MUST CSS 커스텀 프로퍼티(CSS Variables)를 통해 중앙 관리되어 유지보수가 용이해야 한다.

### Key Entities _(include if feature involves data)_

- **ThemeConfig**: 테마별 색상 설정을 정의하는 CSS 변수들의 집합
  - `--bg-primary`: 메인 배경색
  - `--bg-secondary`: secondary 배경색
  - `--text-primary`: 주요 텍스트 색상
  - `--text-secondary`: secondary 텍스트 색상
  - `--editor-bg`: 에디터 배경색
  - `--status-bar-bg`: 상태바 배경색
  - `--scrollbar-thumb`: 스크롤바 썸 색상

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 시스템 테마 변경 후 앱 UI가 5초 이내에 새로운 테마로 완전히 전환된다.
- **SC-002**: 초기 앱 실행 시 흰화면 또는 다크화면 플래시가 발생하지 않는다 (사용자가 플래시를 인지하지 못함).
- **SC-003**: 테마 전환 시 색상 변경이 0.5초 이내에 완료되어 갑작스러운 변화가 느껴지지 않는다.
- **SC-004**: 다크 모드에서 앱을 사용한 사용자가 눈의 피로도를 낮추었다고 보고한다 (사용자 피드백 기반).

---

## Assumptions

- macOS 다크/라이트 모드 전환 시 `prefers-color-scheme` 미디어 쿼리가 정확하게 작동한다고 가정한다.
- Tauri 2.0 + React 19 환경에서 CSS 미디어 쿼리가 올바르게 지원된다고 가정한다.
- 사용자는 현재 수동 테마 전환 옵션을 요청하지 않았으므로, 시스템 테마 자동 감지만 구현한다.
- 모든 CSS 색상 값은 hex 형식으로 정의하며, 기존 디자인 시스템의 색상 팔레트를 기반으로 한다.

## Dependencies

- 기존 CSS 파일들 (App.css, SlateEditor.css, TabBar.css 등)의 색상값을 CSS Variables로 마이그레이션해야 함.
- index.html에 초기 테마 관련 스타일 삽입 필요.

---

## Clarifications

### Session 2026-01-05

- Q: 테마 전환 시 애니메이션 적용 범위 - 모든 UI 요소에 동시에 적용해야 하는가, 아니면 우선순위를 두고 적용해야 하는가? → A: 모든 UI 요소에 동시에 애니메이션 적용
- Q: 고대비 모드(Accessibility Reduced Motion)에서는 애니메이션을 비활성화해야 하는가? → A: 예, Reduced Motion 설정 시 애니메이션 비활성화
