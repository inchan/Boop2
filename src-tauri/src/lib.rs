use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[cfg(target_os = "macos")]
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

// Struct for parsing JSON from file comments
#[derive(Deserialize, Debug)]
struct ScriptJson {
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<String>,
}

// Struct for sending to Frontend
#[derive(Serialize, Debug, Clone)]
struct ScriptMetadata {
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    tags: Option<String>,
    path: String,
    full_text: String,
}

#[tauri::command]
fn load_scripts(app_handle: tauri::AppHandle) -> Result<Vec<ScriptMetadata>, String> {
    let mut scripts = Vec::new();
    let mut debug_log = String::new();
    let mut search_paths = Vec::new();

    // 1. Bundled resource scripts (production)
    match app_handle
        .path()
        .resolve("scripts", tauri::path::BaseDirectory::Resource)
    {
        Ok(path) => search_paths.push(path),
        Err(e) => debug_log.push_str(&format!("Resource resolve failed: {}\n", e)),
    }

    // 2. User custom scripts directory (platform-specific)
    // - macOS: ~/Library/Application Support/com.chans.boop2/scripts/
    // - Linux: ~/.config/com.chans.boop2/scripts/
    // - Windows: %APPDATA%\com.chans.boop2\scripts\
    match app_handle.path().app_config_dir() {
        Ok(config_dir) => {
            let user_scripts_dir = config_dir.join("scripts");
            debug_log.push_str(&format!("[User Scripts] Path: {:?}\n", user_scripts_dir));
            if !user_scripts_dir.exists() {
                debug_log.push_str(
                    "[User Scripts] Directory does not exist. Create it to add custom scripts.\n",
                );
            }
            search_paths.push(user_scripts_dir);
        }
        Err(e) => debug_log.push_str(&format!("App config dir failed: {}\n", e)),
    }

    // 3. Development paths
    search_paths.push(PathBuf::from("scripts"));
    search_paths.push(PathBuf::from("src-tauri/scripts"));

    let mut checked_paths = Vec::new();

    for path in search_paths {
        if checked_paths.contains(&path) {
            continue;
        }
        checked_paths.push(path.clone());

        debug_log.push_str(&format!("Scanning: {:?} ... ", path));

        if path.exists() {
            debug_log.push_str("Found!\n");

            match fs::read_dir(&path) {
                Ok(entries) => {
                    let mut file_count = 0;
                    let mut js_count = 0;

                    for entry in entries.flatten() {
                        let p = entry.path();
                        file_count += 1;
                        let file_name = p.file_name().unwrap_or_default().to_string_lossy();

                        if p.extension().and_then(|s| s.to_str()) == Some("js") {
                            js_count += 1;
                            match fs::read_to_string(&p) {
                                Ok(content) => {
                                    // Parse JSON first
                                    match parse_metadata(&content) {
                                        Ok(json_meta) => {
                                            // Convert to full metadata
                                            let meta = ScriptMetadata {
                                                name: json_meta.name,
                                                description: json_meta.description,
                                                icon: json_meta.icon,
                                                tags: json_meta.tags,
                                                path: p.to_string_lossy().to_string(),
                                                full_text: content,
                                            };
                                            scripts.push(meta);
                                        }
                                        Err(e_msg) => {
                                            debug_log.push_str(&format!(
                                                "  [Parse Error] {}: {}\n",
                                                file_name, e_msg
                                            ));
                                        }
                                    }
                                }
                                Err(e) => {
                                    debug_log.push_str(&format!(
                                        "  [Read Error] {}: {}\n",
                                        file_name, e
                                    ));
                                }
                            }
                        }
                    }
                    debug_log.push_str(&format!(
                        "  -> Scanned {} files, found {} .js files.\n",
                        file_count, js_count
                    ));
                }
                Err(e) => {
                    debug_log.push_str(&format!("  -> read_dir failed: {}\n", e));
                }
            }
        } else {
            debug_log.push_str("Not Found.\n");
        }
    }

    if scripts.is_empty() {
        return Err(format!(
            "No valid scripts loaded. Debug Log:\n{}",
            debug_log
        ));
    }

    Ok(scripts)
}

fn parse_metadata(content: &str) -> Result<ScriptJson, String> {
    let start_tag = "/**";
    let end_tag = "**/";

    match content.find(start_tag) {
        Some(start) => match content.find(end_tag) {
            Some(end) => {
                let json_str = &content[start + start_tag.len()..end];
                match serde_json::from_str::<ScriptJson>(json_str) {
                    Ok(meta) => Ok(meta),
                    Err(e) => Err(format!(
                        "JSON Parse Error: {}. Snippet: >>>{}<<<",
                        e,
                        json_str.trim()
                    )),
                }
            }
            None => {
                let snippet: String = content.chars().take(100).collect();
                Err(format!(
                    "Found '/**' but missing '**/'. Start snippet: >>>{}<<<",
                    snippet
                ))
            }
        },
        None => {
            let snippet: String = content.chars().take(50).collect();
            Err(format!("Missing '/**'. Start snippet: >>>{}<<<", snippet))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::default().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }

            // Create main window with transparent titlebar on macOS
            #[cfg(target_os = "macos")]
            {
                let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                    .title("Boop2")
                    .inner_size(900.0, 700.0)
                    .title_bar_style(TitleBarStyle::Transparent);

                let window = win_builder.build()?;

                // Set window background color based on system theme
                unsafe {
                    use cocoa::appkit::{NSColor, NSWindow};
                    use cocoa::base::{id, nil};
                    use cocoa::foundation::NSString;

                    let ns_window = window.ns_window().unwrap() as id;

                    // Detect system dark mode
                    let defaults: id = cocoa::foundation::NSUserDefaults::standardUserDefaults();
                    let key = NSString::alloc(nil).init_str("AppleInterfaceStyle");
                    let interface_style: id = msg_send![defaults, stringForKey: key];
                    let is_dark_mode = if interface_style != nil {
                        let style_str = std::ffi::CStr::from_ptr(
                            cocoa::foundation::NSString::UTF8String(interface_style),
                        )
                        .to_string_lossy();
                        style_str == "Dark"
                    } else {
                        false // Light mode if key doesn't exist
                    };

                    // Set background color based on theme
                    // Dark mode: #1e1e1e (30, 30, 30), Light mode: #ffffff (255, 255, 255)
                    let bg_color = if is_dark_mode {
                        NSColor::colorWithRed_green_blue_alpha_(
                            nil,
                            30.0 / 255.0,
                            30.0 / 255.0,
                            30.0 / 255.0,
                            1.0,
                        )
                    } else {
                        NSColor::colorWithRed_green_blue_alpha_(nil, 1.0, 1.0, 1.0, 1.0)
                    };
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_scripts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
