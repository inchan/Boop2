import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

// A theme inspired by Boop's native look (often similar to Xcode Dusk or VSCode Dark)
export const boopTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#1E1E1E',
    backgroundImage: '',
    foreground: '#D4D4D4',
    caret: '#FFFFFF', // White cursor
    selection: '#264F78', // Subtle blue selection
    selectionMatch: '#3A3D41',
    lineHighlight: '#ffffff0b', // Very subtle line highlight
    gutterBackground: '#1E1E1E',
    gutterForeground: '#858585',
  },
  styles: [
    { tag: t.comment, color: '#6A9955', fontStyle: 'italic' },
    { tag: t.variableName, color: '#9CDCFE' },
    { tag: [t.string, t.special(t.brace)], color: '#CE9178' },
    { tag: t.number, color: '#B5CEA8' },
    { tag: t.bool, color: '#569CD6' },
    { tag: t.null, color: '#569CD6' },
    { tag: t.keyword, color: '#C586C0' },
    { tag: t.operator, color: '#D4D4D4' },
    { tag: t.className, color: '#4EC9B0' },
    { tag: t.definition(t.typeName), color: '#4EC9B0' },
    { tag: t.typeName, color: '#4EC9B0' },
    { tag: t.angleBracket, color: '#808080' },
    { tag: t.tagName, color: '#569CD6' },
    { tag: t.attributeName, color: '#9CDCFE' },
  ],
});
