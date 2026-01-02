import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Range,
  Text,
  Element as SlateElement,
  BaseEditor,
  Operation,
  Node,
} from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import './SlateEditor.css';

// 들여쓰기 상수 (4 spaces)
const INDENT = '    ';

// Slate.js에서 사용하는 커스텀 타입 정의
type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

type CustomElement = ParagraphElement;
type CustomText = { text: string };

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// 외부에서 에디터 조작할 수 있는 인터페이스
export interface SlateEditorHandle {
  // 전체 텍스트 가져오기
  getText: () => string;
  // 전체 텍스트 설정 (saveHistory: true면 Undo 가능)
  setText: (text: string, options?: { saveHistory?: boolean }) => void;
  // 선택된 텍스트 가져오기
  getSelection: () => string;
  // 선택 범위 정보
  getSelectionRange: () => { from: number; to: number; isEmpty: boolean } | null;
  // 선택 영역에 텍스트 삽입/교체
  replaceSelection: (text: string) => void;
  // 포커스 설정
  focus: () => void;
}

interface SlateEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

// 텍스트를 Slate 노드로 변환
const textToSlateValue = (text: string): Descendant[] => {
  const lines = text.split('\n');
  return lines.map((line) => ({
    type: 'paragraph' as const,
    children: [{ text: line }],
  }));
};

// Slate 노드를 텍스트로 변환
const slateValueToText = (nodes: Descendant[]): string => {
  return nodes
    .map((node) => {
      if (SlateElement.isElement(node) && node.type === 'paragraph') {
        return node.children.map((child) => (Text.isText(child) ? child.text : '')).join('');
      }
      return '';
    })
    .join('\n');
};

// 오프셋 계산: Slate 노드에서 절대 위치 계산
const getAbsoluteOffset = (editor: Editor, path: number[], offset: number): number => {
  let absoluteOffset = 0;
  const [lineIndex] = path;

  // 이전 라인들의 길이 합산
  for (let i = 0; i < lineIndex; i++) {
    const node = editor.children[i];
    if (SlateElement.isElement(node)) {
      const lineText = node.children.map((c) => (Text.isText(c) ? c.text : '')).join('');
      absoluteOffset += lineText.length + 1; // +1 for newline
    }
  }

  // 현재 라인에서의 오프셋 추가
  absoluteOffset += offset;

  return absoluteOffset;
};

const SlateEditor = forwardRef<SlateEditorHandle, SlateEditorProps>(
  ({ initialValue = '', onChange, autoFocus = true, placeholder = '' }, ref) => {
    const [editor] = useState(() => withReact(withHistory(createEditor())));
    const gutterRef = useRef<HTMLDivElement>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);
    const [lineCount, setLineCount] = useState(1);
    const [activeLine, setActiveLine] = useState(0);

    // 초기값 설정
    const initialSlateValue = useMemo(() => {
      return textToSlateValue(initialValue);
    }, [initialValue]);

    // 외부 인터페이스 노출
    useImperativeHandle(
      ref,
      () => ({
        getText: () => slateValueToText(editor.children),

        setText: (text: string, options?: { saveHistory?: boolean }) => {
          const doTransform = () => {
            Transforms.delete(editor, {
              at: {
                anchor: Editor.start(editor, []),
                focus: Editor.end(editor, []),
              },
            });
            const nodes = textToSlateValue(text);
            Transforms.insertNodes(editor, nodes, { at: [0] });
            if (editor.children.length > nodes.length) {
              Transforms.removeNodes(editor, { at: [editor.children.length - 1] });
            }
          };

          if (options?.saveHistory) {
            doTransform();
          } else {
            HistoryEditor.withoutSaving(editor, doTransform);
          }

          Transforms.select(editor, Editor.start(editor, []));
          setLineCount(textToSlateValue(text).length);
          setActiveLine(0);
        },

        getSelection: () => {
          const { selection } = editor;
          if (!selection || Range.isCollapsed(selection)) {
            return '';
          }
          return Editor.string(editor, selection);
        },

        getSelectionRange: () => {
          const { selection } = editor;
          if (!selection) return null;

          const from = getAbsoluteOffset(editor, selection.anchor.path, selection.anchor.offset);
          const to = getAbsoluteOffset(editor, selection.focus.path, selection.focus.offset);

          return {
            from: Math.min(from, to),
            to: Math.max(from, to),
            isEmpty: Range.isCollapsed(selection),
          };
        },

        replaceSelection: (text: string) => {
          const { selection } = editor;
          if (!selection) return;

          if (Range.isCollapsed(selection)) {
            // 선택 없으면 커서 위치에 삽입
            Transforms.insertText(editor, text);
          } else {
            // 선택 영역 교체
            Transforms.delete(editor);
            Transforms.insertText(editor, text);
          }
        },

        focus: () => {
          ReactEditor.focus(editor);
        },
      }),
      [editor]
    );

    // initialValue 변경 감지 (탭 전환 시 key 없이 동기화)
    // 에디터 내부 변경과 외부 변경(탭 전환)을 구분하기 위해 현재 내용과 비교
    const prevInitialValueRef = useRef(initialValue);
    useEffect(() => {
      if (prevInitialValueRef.current !== initialValue) {
        prevInitialValueRef.current = initialValue;

        // 현재 에디터 내용과 새 initialValue를 비교
        // 같으면 에디터 자체 변경이므로 무시 (커서 유지)
        const currentText = slateValueToText(editor.children);
        if (currentText === initialValue) {
          return; // 에디터 내부 변경이므로 동기화 불필요
        }

        // 외부에서 변경된 경우에만 동기화 (탭 전환 등)
        HistoryEditor.withoutSaving(editor, () => {
          Transforms.delete(editor, {
            at: {
              anchor: Editor.start(editor, []),
              focus: Editor.end(editor, []),
            },
          });
          const nodes = textToSlateValue(initialValue);
          Transforms.insertNodes(editor, nodes, { at: [0] });
          if (editor.children.length > nodes.length) {
            Transforms.removeNodes(editor, { at: [editor.children.length - 1] });
          }
        });
        // 상태 업데이트
        setLineCount(textToSlateValue(initialValue).length);
        setActiveLine(0);
        // 커서 초기화
        try {
          Transforms.select(editor, Editor.start(editor, []));
        } catch {
          // 빈 문서일 경우 무시
        }
      }
    }, [initialValue, editor]);

    // 자동 포커스
    useEffect(() => {
      if (autoFocus) {
        try {
          ReactEditor.focus(editor);
        } catch {
          // 초기 렌더링 시 에러 무시
        }
      }
    }, [autoFocus, editor]);

    // 스크롤 동기화
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      if (gutterRef.current) {
        gutterRef.current.scrollTop = e.currentTarget.scrollTop;
      }
    }, []);

    // 값 변경 핸들러
    const handleChange = useCallback(
      (value: Descendant[]) => {
        // 라인 수 업데이트
        setLineCount(value.length);

        // 현재 라인 업데이트
        const { selection } = editor;
        if (selection) {
          setActiveLine(selection.anchor.path[0]);
        }

        // IME 조합 중에는 외부에 알리지 않음
        if (isComposingRef.current) return;

        // 실제 콘텐츠 변경인지 확인 (selection만 변경된 경우 제외)
        const isContentChange = editor.operations.some(
          (op: Operation) => op.type !== 'set_selection'
        );

        if (isContentChange && onChange) {
          const text = slateValueToText(value);
          onChange(text);
        }
      },
      [editor, onChange]
    );

    // IME 이벤트 핸들러
    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      // 약간의 딜레이 후 composition 종료 처리
      setTimeout(() => {
        isComposingRef.current = false;
        // Composition 완료 후 onChange 호출
        if (onChange) {
          const text = slateValueToText(editor.children);
          onChange(text);
        }
      }, 50);
    }, [editor, onChange]);

    // 복사 이벤트 핸들러 - 빈 줄 포함하여 plain text 직렬화
    const handleCopy = useCallback(
      (event: React.ClipboardEvent<HTMLDivElement>) => {
        const { selection } = editor;
        if (!selection || Range.isCollapsed(selection)) return;

        const fragment = Editor.fragment(editor, selection);
        const text = fragment.map((node) => Node.string(node)).join('\n');

        event.clipboardData.setData('text/plain', text);
        // 기본 Slate 동작 유지하지 않음 (preventDefault 호출)
        event.preventDefault();
      },
      [editor]
    );

    // 키보드 이벤트 핸들러
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        // Enter 키: 새 paragraph 생성
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          // Slate 기본 방식: 현재 노드 분리하여 새 paragraph 생성
          Editor.insertBreak(editor);
          return;
        }

        // Tab 키: 들여쓰기 / Shift+Tab: 내어쓰기
        if (event.key === 'Tab') {
          event.preventDefault();

          const { selection } = editor;
          if (!selection) return;

          if (event.shiftKey) {
            // Shift+Tab: 내어쓰기
            const [start, end] = Range.edges(selection);
            const startLine = start.path[0];
            const endLine = Range.isCollapsed(selection) ? startLine : end.path[0];

            // 역순으로 처리하여 offset 변경 문제 방지
            for (let i = endLine; i >= startLine; i--) {
              const node = editor.children[i];
              const text = Node.string(node);
              const match = text.match(/^( {1,4})/);

              if (match) {
                const spacesToRemove = match[1].length;
                const lineStart = Editor.start(editor, [i]);
                Transforms.delete(editor, {
                  at: {
                    anchor: lineStart,
                    focus: { ...lineStart, offset: spacesToRemove },
                  },
                });
              }
            }
          } else {
            // Tab: 들여쓰기
            if (Range.isCollapsed(selection)) {
              // 단일 커서: 현재 위치에 4 공백 삽입
              Transforms.insertText(editor, INDENT);
            } else {
              // 여러 줄 선택: 각 줄 시작에 4 공백 삽입
              const [start, end] = Range.edges(selection);
              const startLine = start.path[0];
              const endLine = end.path[0];

              // 역순으로 처리하여 offset 변경 문제 방지
              for (let i = endLine; i >= startLine; i--) {
                const lineStart = Editor.start(editor, [i]);
                Transforms.insertText(editor, INDENT, { at: lineStart });
              }
            }
          }
          return;
        }
      },
      [editor]
    );

    // 선택 변경 감지
    const handleSelect = useCallback(() => {
      const { selection } = editor;
      if (selection) {
        setActiveLine(selection.anchor.path[0]);
      }
    }, [editor]);

    // Paragraph 렌더링
    const renderElement = useCallback(
      (props: { attributes: object; children: React.ReactNode; element: CustomElement }) => {
        const { attributes, children, element } = props;
        const path = ReactEditor.findPath(editor, element);
        const isActive = path[0] === activeLine;

        return (
          <div {...attributes} className={`slate-paragraph ${isActive ? 'active-line' : ''}`}>
            {children}
          </div>
        );
      },
      [editor, activeLine]
    );

    // 라인 번호 렌더링
    const lineNumbers = useMemo(() => {
      return Array.from({ length: lineCount }, (_, i) => (
        <div key={i} className={`slate-line-number ${i === activeLine ? 'active' : ''}`}>
          {i + 1}
        </div>
      ));
    }, [lineCount, activeLine]);

    return (
      <div className="slate-editor-container" ref={editorContainerRef}>
        <div className="slate-gutter-wrapper">
          <div className="slate-gutter" ref={gutterRef}>
            {lineNumbers}
          </div>
        </div>
        <Slate editor={editor} initialValue={initialSlateValue} onChange={handleChange}>
          <Editable
            className="slate-editor"
            placeholder={placeholder}
            autoFocus={autoFocus}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            onScroll={handleScroll}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onCopy={handleCopy}
            renderElement={renderElement}
          />
        </Slate>
      </div>
    );
  }
);

SlateEditor.displayName = 'SlateEditor';

export default SlateEditor;
