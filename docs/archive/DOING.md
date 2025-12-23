# Current Status: Layer 7 - Multi-Tab System

We are migrating Boop to Tauri using a granular, layer-based approach.

## ✅ Layer 1~4: Foundation & Logic
- [x] Initialized Tauri 2.0 Project.
- [x] Integrated CodeMirror 6.
- [x] Implemented Script Engine & Web Worker.
- [x] Verified File System Script Loading.

## ✅ Layer 5~6: UI & Compatibility
- [x] Implemented Command Palette.
- [x] Added Full Library Shims (lodash, he, etc.).
- [x] Customized Boop Dark Theme & SF Mono Font.
- [x] Organized Project Structure & Flattened Paths.

## 🏗 Layer 7: Multi-Tab System (Current)
Goal: Support multiple documents with a terminal-like tab bar.
- [ ] Define Tab Data Structure & State Management.
- [ ] Create `TabBar` Component & Styling.
- [ ] Implement Add/Remove/Switch Tab Logic.
- [ ] Add Hotkeys (Cmd+T, Cmd+W, Cmd+Numbers).
- [ ] Sync Tab Content with LocalStorage for Persistence.

## 🔮 Future Layers
- Layer 8: Preferences UI (Custom Fonts, Hotkeys).
- Layer 9: Global Shortcut (Bring to Front).