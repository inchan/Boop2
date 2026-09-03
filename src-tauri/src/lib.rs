#![allow(unexpected_cfgs)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::PathBuf;
use tauri::Manager;

#[cfg(target_os = "macos")]
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

const MIN_MENU_WIDTH: f64 = 130.0;
const MIN_LIST_WIDTH: f64 = 150.0;
const MIN_CONTENT_WIDTH: f64 = 480.0;
const RESIZE_HANDLE_WIDTH: f64 = 6.0;
const MIN_WINDOW_WIDTH: f64 =
    MIN_MENU_WIDTH + MIN_LIST_WIDTH + MIN_CONTENT_WIDTH + RESIZE_HANDLE_WIDTH * 2.0;
const MIN_WINDOW_HEIGHT: f64 = 500.0;

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

#[derive(Serialize, Debug, Clone)]
struct ProjectFileNode {
    id: String,
    name: String,
    path: String,
    kind: String,
    extension: Option<String>,
    children_loaded: bool,
}

fn file_extension(name: &str) -> Option<String> {
    std::path::Path::new(name)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_string())
}

fn is_excluded_project_entry(name: &str, is_dir: bool) -> bool {
    const EXCLUDED_DIRS: &[&str] = &[
        ".git",
        "node_modules",
        "dist",
        "dist-ssr",
        "target",
        "coverage",
        "playwright-report",
        "test-results",
    ];

    name.starts_with('.') || (is_dir && EXCLUDED_DIRS.contains(&name))
}

fn project_node_id(path: &std::path::Path) -> String {
    path.to_string_lossy().to_string()
}

fn project_file_node(path: &std::path::Path) -> Result<ProjectFileNode, String> {
    let name = path
        .file_name()
        .and_then(|file_name| file_name.to_str())
        .ok_or_else(|| "Project file node path has no valid name".to_string())?
        .to_string();
    let is_dir = path.is_dir();

    Ok(ProjectFileNode {
        id: project_node_id(path),
        name: name.clone(),
        path: path.to_string_lossy().to_string(),
        kind: if is_dir { "folder" } else { "file" }.to_string(),
        extension: if is_dir { None } else { file_extension(&name) },
        children_loaded: false,
    })
}

fn untitled_child_path(
    parent: &std::path::Path,
    extension: Option<&str>,
    number: usize,
) -> PathBuf {
    let suffix = if number == 1 {
        String::new()
    } else {
        format!(" {}", number)
    };
    let file_name = match extension {
        Some(extension) => format!("Untitled{}.{}", suffix, extension),
        None => format!("Untitled{}", suffix),
    };

    parent.join(file_name)
}

fn ensure_project_parent(parent_path: String) -> Result<PathBuf, String> {
    let parent = PathBuf::from(parent_path);
    if !parent.is_dir() {
        return Err("Project parent path is not a directory".to_string());
    }

    Ok(parent)
}

#[tauri::command]
fn list_project_directory(path: String) -> Result<Vec<ProjectFileNode>, String> {
    let directory = PathBuf::from(path);
    if !directory.is_dir() {
        return Err("Project directory path is not a directory".to_string());
    }

    let entries = fs::read_dir(&directory).map_err(|error| error.to_string())?;
    let mut nodes = Vec::new();

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = entry_path.is_dir();
        if is_excluded_project_entry(&name, is_dir) {
            continue;
        }

        nodes.push(project_file_node(&entry_path)?);
    }

    nodes.sort_by(|left, right| {
        let left_rank = if left.kind == "folder" { 0 } else { 1 };
        let right_rank = if right.kind == "folder" { 0 } else { 1 };
        left_rank
            .cmp(&right_rank)
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });

    Ok(nodes)
}

#[tauri::command]
fn read_project_file(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(path);
    if !file_path.is_file() {
        return Err("Project file path is not a file".to_string());
    }

    fs::read_to_string(file_path).map_err(|error| error.to_string())
}

#[tauri::command]
fn create_project_file(parent_path: String) -> Result<ProjectFileNode, String> {
    let parent = ensure_project_parent(parent_path)?;

    for number in 1.. {
        let file_path = untitled_child_path(&parent, Some("md"), number);
        match fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file_path)
        {
            Ok(_) => return project_file_node(&file_path),
            Err(error) if error.kind() == ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(error.to_string()),
        }
    }

    Err("Unable to create Project file".to_string())
}

#[tauri::command]
fn create_project_folder(parent_path: String) -> Result<ProjectFileNode, String> {
    let parent = ensure_project_parent(parent_path)?;

    for number in 1.. {
        let folder_path = untitled_child_path(&parent, None, number);
        match fs::create_dir(&folder_path) {
            Ok(_) => return project_file_node(&folder_path),
            Err(error) if error.kind() == ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(error.to_string()),
        }
    }

    Err("Unable to create Project folder".to_string())
}

#[tauri::command]
fn move_project_entry(
    source_path: String,
    destination_folder_path: String,
) -> Result<ProjectFileNode, String> {
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Project entry source does not exist".to_string());
    }

    let destination_folder = ensure_project_parent(destination_folder_path)?;
    let source_name = source
        .file_name()
        .ok_or_else(|| "Project entry source has no file name".to_string())?;
    let destination = destination_folder.join(source_name);

    if destination.exists() {
        let source_canonical = fs::canonicalize(&source).map_err(|error| error.to_string())?;
        let destination_canonical =
            fs::canonicalize(&destination).map_err(|error| error.to_string())?;
        if source_canonical == destination_canonical {
            return project_file_node(&source);
        }

        return Err("Destination already exists".to_string());
    }

    if source.is_dir() {
        let source_canonical = fs::canonicalize(&source).map_err(|error| error.to_string())?;
        let destination_folder_canonical =
            fs::canonicalize(&destination_folder).map_err(|error| error.to_string())?;
        if destination_folder_canonical.starts_with(&source_canonical) {
            return Err("Cannot move a folder into itself".to_string());
        }
    }

    fs::rename(&source, &destination).map_err(|error| error.to_string())?;
    project_file_node(&destination)
}

fn is_valid_entry_name(name: &str) -> bool {
    let trimmed = name.trim();
    !trimmed.is_empty()
        && trimmed != "."
        && trimmed != ".."
        && !trimmed.contains('/')
        && !trimmed.contains('\\')
}

#[tauri::command]
fn rename_project_entry(
    source_path: String,
    new_name: String,
) -> Result<ProjectFileNode, String> {
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Project entry source does not exist".to_string());
    }

    if !is_valid_entry_name(&new_name) {
        return Err("Invalid name".to_string());
    }

    let parent = source
        .parent()
        .ok_or_else(|| "Project entry source has no parent".to_string())?;
    let destination = parent.join(new_name.trim());

    if destination.exists() {
        let source_canonical = fs::canonicalize(&source).map_err(|error| error.to_string())?;
        let destination_canonical =
            fs::canonicalize(&destination).map_err(|error| error.to_string())?;
        if source_canonical == destination_canonical {
            let current_name = source.file_name().and_then(|name| name.to_str());
            // Same path on a case-insensitive filesystem: a no-op only if the
            // requested name matches the current one. A case-only change must
            // still perform the rename.
            if current_name == Some(new_name.trim()) {
                return project_file_node(&source);
            }
        } else {
            return Err("Destination already exists".to_string());
        }
    }

    fs::rename(&source, &destination).map_err(|error| error.to_string())?;
    project_file_node(&destination)
}

#[tauri::command]
fn delete_project_entry(path: String) -> Result<(), String> {
    let entry = PathBuf::from(&path);
    if !entry.exists() {
        return Err("Project entry does not exist".to_string());
    }

    trash::delete(&entry).map_err(|error| error.to_string())
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
        .plugin(tauri_plugin_dialog::init())
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
                    .min_inner_size(MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT)
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
        .invoke_handler(tauri::generate_handler![
            load_scripts,
            list_project_directory,
            read_project_file,
            create_project_file,
            create_project_folder,
            move_project_entry,
            rename_project_entry,
            delete_project_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temporary_project_dir(test_name: &str) -> PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after UNIX_EPOCH")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "boop2-{}-{}-{}",
            test_name,
            std::process::id(),
            timestamp
        ));
        fs::create_dir(&path).expect("temporary project dir should be created");
        path
    }

    #[test]
    fn minimum_window_width_matches_shell_panes() {
        assert_eq!(MIN_WINDOW_WIDTH, 772.0);
    }

    #[test]
    fn project_file_extension_uses_final_extension() {
        assert_eq!(file_extension("AppShell.tsx"), Some("tsx".to_string()));
        assert_eq!(file_extension("script.test.ts"), Some("ts".to_string()));
        assert_eq!(file_extension("README"), None);
    }

    #[test]
    fn project_directory_exclusion_skips_generated_and_hidden_dirs() {
        assert!(is_excluded_project_entry(".git", true));
        assert!(is_excluded_project_entry("node_modules", true));
        assert!(is_excluded_project_entry("target", true));
        assert!(is_excluded_project_entry(".env", false));
        assert!(!is_excluded_project_entry("src", true));
        assert!(!is_excluded_project_entry("App.tsx", false));
    }

    #[test]
    fn create_project_file_numbers_untitled_md() {
        let project_dir = temporary_project_dir("create-file");

        let first = create_project_file(project_dir.to_string_lossy().to_string())
            .expect("first file should be created");
        let second = create_project_file(project_dir.to_string_lossy().to_string())
            .expect("second file should be created");

        assert_eq!(first.name, "Untitled.md");
        assert_eq!(first.kind, "file");
        assert_eq!(first.extension, Some("md".to_string()));
        assert_eq!(second.name, "Untitled 2.md");

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn create_project_folder_numbers_untitled() {
        let project_dir = temporary_project_dir("create-folder");

        let first = create_project_folder(project_dir.to_string_lossy().to_string())
            .expect("first folder should be created");
        let second = create_project_folder(project_dir.to_string_lossy().to_string())
            .expect("second folder should be created");

        assert_eq!(first.name, "Untitled");
        assert_eq!(first.kind, "folder");
        assert_eq!(first.extension, None);
        assert_eq!(second.name, "Untitled 2");

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn move_project_entry_moves_file_into_folder() {
        let project_dir = temporary_project_dir("move-file");
        let destination_dir = project_dir.join("destination");
        let source_file = project_dir.join("note.md");
        fs::create_dir(&destination_dir).expect("destination dir should be created");
        fs::write(&source_file, "hello").expect("source file should be created");

        let moved = move_project_entry(
            source_file.to_string_lossy().to_string(),
            destination_dir.to_string_lossy().to_string(),
        )
        .expect("file should move");

        assert_eq!(moved.name, "note.md");
        assert_eq!(moved.kind, "file");
        assert!(!source_file.exists());
        assert!(destination_dir.join("note.md").exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn move_project_entry_rejects_existing_destination() {
        let project_dir = temporary_project_dir("move-existing");
        let destination_dir = project_dir.join("destination");
        let source_file = project_dir.join("note.md");
        fs::create_dir(&destination_dir).expect("destination dir should be created");
        fs::write(&source_file, "hello").expect("source file should be created");
        fs::write(destination_dir.join("note.md"), "existing")
            .expect("existing destination should be created");

        let result = move_project_entry(
            source_file.to_string_lossy().to_string(),
            destination_dir.to_string_lossy().to_string(),
        );

        assert_eq!(
            result.expect_err("move should reject existing destination"),
            "Destination already exists"
        );
        assert!(source_file.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn move_project_entry_rejects_folder_into_descendant() {
        let project_dir = temporary_project_dir("move-descendant");
        let source_dir = project_dir.join("source");
        let destination_dir = source_dir.join("child");
        fs::create_dir(&source_dir).expect("source dir should be created");
        fs::create_dir(&destination_dir).expect("destination dir should be created");

        let result = move_project_entry(
            source_dir.to_string_lossy().to_string(),
            destination_dir.to_string_lossy().to_string(),
        );

        assert_eq!(
            result.expect_err("move should reject a folder into its descendant"),
            "Cannot move a folder into itself"
        );
        assert!(source_dir.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_renames_file() {
        let project_dir = temporary_project_dir("rename-file");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");

        let renamed = rename_project_entry(
            source_file.to_string_lossy().to_string(),
            "renamed.md".to_string(),
        )
        .expect("file should rename");

        assert_eq!(renamed.name, "renamed.md");
        assert_eq!(renamed.kind, "file");
        assert!(!source_file.exists());
        assert!(project_dir.join("renamed.md").exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_rejects_existing_destination() {
        let project_dir = temporary_project_dir("rename-existing");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");
        fs::write(project_dir.join("taken.md"), "existing")
            .expect("existing file should be created");

        let result = rename_project_entry(
            source_file.to_string_lossy().to_string(),
            "taken.md".to_string(),
        );

        assert_eq!(
            result.expect_err("rename should reject existing destination"),
            "Destination already exists"
        );
        assert!(source_file.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_rejects_invalid_name() {
        let project_dir = temporary_project_dir("rename-invalid");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");

        for bad in ["", "   ", "a/b.md", "..", "."] {
            let result = rename_project_entry(
                source_file.to_string_lossy().to_string(),
                bad.to_string(),
            );
            assert_eq!(
                result.expect_err("rename should reject invalid name"),
                "Invalid name"
            );
        }
        assert!(source_file.exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn rename_project_entry_changes_only_case() {
        let project_dir = temporary_project_dir("rename-case");
        let source_file = project_dir.join("note.md");
        fs::write(&source_file, "hello").expect("source file should be created");

        let renamed = rename_project_entry(
            source_file.to_string_lossy().to_string(),
            "Note.md".to_string(),
        )
        .expect("file should rename");

        assert_eq!(renamed.name, "Note.md");
        assert!(project_dir.join("Note.md").exists());

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }

    #[test]
    fn delete_project_entry_rejects_missing_path() {
        let project_dir = temporary_project_dir("delete-missing");
        let missing = project_dir.join("nope.md");

        let result = delete_project_entry(missing.to_string_lossy().to_string());

        assert_eq!(
            result.expect_err("delete should reject missing path"),
            "Project entry does not exist"
        );

        fs::remove_dir_all(project_dir).expect("temporary project dir should be removed");
    }
}
