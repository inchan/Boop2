import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

// A theme inspired by Boop's native look (often similar to Xcode Dusk or VSCode Dark)
export const boopTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#1E1E1E',
    backgroundImage: '',
    foreground: '#FFFFFF', // White text color
    caret: '#FFFFFF', // White cursor
    selection: '#264F78', // Subtle blue selection
    selectionMatch: '#3A3D41',
    lineHighlight: '#ffffff0b', // Very subtle line highlight
    gutterBackground: '#1E1E1E',
    gutterForeground: '#858585',
  },
  styles: [
    { tag: t.comment, color: '#FFFFFF' },
    { tag: t.variableName, color: '#FFFFFF' },
    { tag: [t.string, t.special(t.brace)], color: '#FFFFFF' },
    { tag: t.number, color: '#FFFFFF' },
    { tag: t.bool, color: '#FFFFFF' },
    { tag: t.null, color: '#FFFFFF' },
    { tag: t.keyword, color: '#FFFFFF' },
    { tag: t.operator, color: '#FFFFFF' },
    { tag: t.className, color: '#FFFFFF' },
    { tag: t.definition(t.typeName), color: '#FFFFFF' },
    { tag: t.typeName, color: '#FFFFFF' },
    { tag: t.angleBracket, color: '#FFFFFF' },
    { tag: t.tagName, color: '#FFFFFF' },
    { tag: t.attributeName, color: '#FFFFFF' },
  ],
});
