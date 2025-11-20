// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
    Manager,
};

mod database;

#[tauri::command]
fn get_image_files(directory: String) -> Result<Vec<String>, String> {
    let path = Path::new(&directory);

    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut image_files: Vec<String> = Vec::new();

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(extension) = path.extension() {
                            let ext = extension.to_string_lossy().to_lowercase();
                            if ext == "jpg" || ext == "jpeg" || ext == "png" {
                                if let Some(path_str) = path.to_str() {
                                    image_files.push(path_str.to_string());
                                }
                            }
                        }
                    }
                }
            }
            image_files.sort();
            Ok(image_files)
        }
        Err(e) => Err(format!("Failed to read directory: {}", e)),
    }
}

#[tauri::command]
fn read_text_file(file_path: String) -> Result<String, String> {
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
fn write_text_file(file_path: String, content: String) -> Result<(), String> {
    // Normalize path for Windows compatibility
    let normalized_path = file_path.replace("/", "\\");
    let path = if cfg!(windows) { &normalized_path } else { &file_path };

    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(path).parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return Err(format!("Failed to create directory '{}': {}", parent.display(), e));
            }
        }
    }

    // Write file with detailed error reporting
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(e) => {
            // Provide more detailed error message for Windows debugging
            let error_kind = e.kind();
            Err(format!(
                "Failed to write file '{}': {} (Error kind: {:?})",
                path, e, error_kind
            ))
        }
    }
}

#[tauri::command]
fn file_exists(file_path: String) -> bool {
    Path::new(&file_path).exists()
}

#[tauri::command]
fn create_directory(dir_path: String) -> Result<(), String> {
    match fs::create_dir_all(&dir_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create directory: {}", e)),
    }
}

#[tauri::command]
fn copy_file(source: String, destination: String) -> Result<(), String> {
    // Create parent directory if it doesn't exist
    if let Some(parent) = Path::new(&destination).parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return Err(format!("Failed to create directory: {}", e));
            }
        }
    }

    match fs::copy(&source, &destination) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to copy file: {}", e)),
    }
}

#[tauri::command]
fn get_parent_directory(file_path: String) -> Result<String, String> {
    match Path::new(&file_path).parent() {
        Some(parent) => {
            if let Some(parent_str) = parent.to_str() {
                Ok(parent_str.to_string())
            } else {
                Err("Failed to convert path to string".to_string())
            }
        }
        None => Err("No parent directory found".to_string()),
    }
}

#[tauri::command]
fn get_filename(file_path: String) -> Result<String, String> {
    match Path::new(&file_path).file_name() {
        Some(filename) => {
            if let Some(filename_str) = filename.to_str() {
                Ok(filename_str.to_string())
            } else {
                Err("Failed to convert filename to string".to_string())
            }
        }
        None => Err("No filename found".to_string()),
    }
}

#[tauri::command]
fn organize_files(
    directory: String,
    output_folder: String,
    retouch_files: Vec<String>,
    retake_files: Vec<String>,
    wrong_files: Vec<String>,
) -> Result<String, String> {
    let base_path = Path::new(&directory);

    // Create main output folder
    let output_path = base_path.join(&output_folder);
    if let Err(e) = fs::create_dir_all(&output_path) {
        return Err(format!("Failed to create output folder: {}", e));
    }

    let mut total_copied = 0;
    let mut errors = Vec::new();

    // Helper function to extract just the filename from a path
    let get_filename = |path: &str| -> String {
        Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(path)
            .to_string()
    };

    // Copy all files directly into the main output folder (no subfolders)
    // Copy retouch files
    for file_path in &retouch_files {
        let source = Path::new(file_path);
        let filename = get_filename(file_path);
        let destination = output_path.join(&filename);

        match fs::copy(&source, &destination) {
            Ok(_) => {
                total_copied += 1;
                println!("✓ Copied: {} -> {}", source.display(), destination.display());
            }
            Err(e) => {
                let error_msg = format!("Failed to copy {}: {}", filename, e);
                eprintln!("✗ {}", error_msg);
                errors.push(error_msg);
            }
        }
    }

    // Copy retake files
    for file_path in &retake_files {
        let source = Path::new(file_path);
        let filename = get_filename(file_path);
        let destination = output_path.join(&filename);

        match fs::copy(&source, &destination) {
            Ok(_) => {
                total_copied += 1;
                println!("✓ Copied: {} -> {}", source.display(), destination.display());
            }
            Err(e) => {
                let error_msg = format!("Failed to copy {}: {}", filename, e);
                eprintln!("✗ {}", error_msg);
                errors.push(error_msg);
            }
        }
    }

    // Copy wrong files
    for file_path in &wrong_files {
        let source = Path::new(file_path);
        let filename = get_filename(file_path);
        let destination = output_path.join(&filename);

        match fs::copy(&source, &destination) {
            Ok(_) => {
                total_copied += 1;
                println!("✓ Copied: {} -> {}", source.display(), destination.display());
            }
            Err(e) => {
                let error_msg = format!("Failed to copy {}: {}", filename, e);
                eprintln!("✗ {}", error_msg);
                errors.push(error_msg);
            }
        }
    }

    if !errors.is_empty() {
        println!("Errors encountered: {:?}", errors);
    }

    Ok(format!(
        "Files organized successfully: {} files copied ({} Retouch, {} Retake, {} Wrong)",
        total_copied,
        retouch_files.len(),
        retake_files.len(),
        wrong_files.len()
    ))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.app_handle();

            // Build File menu with Settings, User Names, and Close Window
            let settings_item = MenuItem::with_id(
                app_handle,
                "open-settings",
                "Settings",
                true,
                Some("CmdOrCtrl+,"),
            )?;
            let user_names_item = MenuItem::with_id(
                app_handle,
                "open-usernames",
                "User Names",
                true,
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app_handle)?;
            let close_item = PredefinedMenuItem::close_window(app_handle, None)?;

            let file_submenu = Submenu::with_items(
                app_handle,
                "File",
                true,
                &[&settings_item, &user_names_item, &separator, &close_item],
            )?;

            // Build Developer menu with DevTools toggle
            let devtools_item = MenuItem::with_id(
                app_handle,
                "toggle-devtools",
                "Toggle Developer Tools",
                true,
                Some("F12"),
            )?;

            let developer_submenu = Submenu::with_items(
                app_handle,
                "Developer",
                true,
                &[&devtools_item],
            )?;

            let app_menu = Menu::with_items(app_handle, &[&file_submenu, &developer_submenu])?;
            app.set_menu(app_menu)?;

            // Handle menu events
            app.on_menu_event(move |app, event| {
                match event.id().as_ref() {
                    "open-settings" => {
                        let _ = app.emit("open-settings", ());
                    }
                    "open-usernames" => {
                        let _ = app.emit("open-usernames", ());
                    }
                    "toggle-devtools" => {
                        // Toggle DevTools for the main window
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_devtools_open() {
                                let _ = window.close_devtools();
                            } else {
                                let _ = window.open_devtools();
                            }
                        }
                    }
                    "Cards & Observations" => {
                        let _ = app.emit("open-cards-settings", ());
                    }
                    "Layout" => {
                        let _ = app.emit("open-layout-settings", ());
                    }
                    "Colors" => {
                        let _ = app.emit("open-colors-settings", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_image_files,
            read_text_file,
            write_text_file,
            file_exists,
            create_directory,
            copy_file,
            get_parent_directory,
            get_filename,
            organize_files,
            database::init_database,
            database::create_session,
            database::save_qc_record,
            database::get_session_history,
            database::get_analytics_data,
            database::get_analytics_records,
            database::save_app_setting,
            database::load_app_settings,
            database::get_database_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
