# Boop (Tauri Edition)

Boop is a scriptable text manipulation tool for developers. Ported from the original macOS app to [Tauri](https://tauri.app/), it's faster, lighter, and cross-platform.

## 📥 Get Started
1.  **Download:** Get the latest `.app` or `.dmg` from the Releases.
2.  **Install:** Move to your `/Applications` folder.
3.  **Run:** Open Boop and press `Cmd+B` to start booping!

## 📖 Documentation
- **[User Guide](docs/USER_GUIDE.md)**: How to use the app.
- **[Custom Scripts](docs/CustomScripts.md)**: Write your own text transformations.
- **[Supported Modules](docs/Modules.md)**: Libraries you can use in your scripts.
- **[Debugging](docs/Debugging.md)**: How to fix scripts that aren't working.

---

## 🛠 Development
To run locally:
```bash
# Clone the repo
git clone https://github.com/chans/Boop2.git
cd Boop2

# Install dependencies
npm install

# Run in dev mode
npm run tauri dev
```

## 🧪 Testing
```bash
npm run test
```

## 📂 Project Structure
- `src/`: Frontend React source.
- `src-tauri/`: Backend Rust source and scripts.
- `docs/`: Project documentation.
- `docs/DEVELOPMENT.md`: Technical architecture and detailed setup.

## ⚖️ License
MIT License. Based on the original Boop by [Ivan Mathy](https://github.com/IvanMathy).