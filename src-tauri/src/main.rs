// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
    pub comment: String,
    pub line_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedConfig {
    pub entries: Vec<ConfigEntry>,
    pub raw_lines: Vec<String>,
}

fn parse_config(content: &str) -> ParsedConfig {
    let mut entries = Vec::new();
    let raw_lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();

    for (i, line) in raw_lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("set ") {
            let rest = &trimmed[4..];
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            if parts.len() >= 2 {
                let key = parts[0].trim().to_string();
                let value_and_comment = parts[1].trim();

                // Split value from inline comment (//)
                let (value, comment) = if let Some(comment_pos) = find_comment(value_and_comment) {
                    let val = value_and_comment[..comment_pos].trim().to_string();
                    let com = value_and_comment[comment_pos + 2..].trim().to_string();
                    (val, com)
                } else {
                    (value_and_comment.to_string(), String::new())
                };

                entries.push(ConfigEntry {
                    key,
                    value,
                    comment,
                    line_index: i,
                });
            }
        }
    }

    ParsedConfig { entries, raw_lines }
}

// Find position of "//" that's not inside a string value
fn find_comment(s: &str) -> Option<usize> {
    let in_string = s.starts_with('"');
    if in_string {
        // Find closing quote, then look for //
        let mut chars = s.chars().enumerate();
        chars.next(); // skip opening quote
        let mut end_quote = None;
        for (i, c) in chars {
            if c == '"' {
                end_quote = Some(i);
                break;
            }
        }
        if let Some(eq) = end_quote {
            let rest = &s[eq + 1..];
            if let Some(pos) = rest.find("//") {
                return Some(eq + 1 + pos);
            }
        }
        None
    } else {
        s.find("//")
    }
}

fn rebuild_config(raw_lines: &[String], updates: &HashMap<String, String>) -> String {
    let mut lines = raw_lines.to_vec();

    for (i, line) in lines.iter_mut().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("set ") {
            let rest = &trimmed[4..];
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            if parts.len() >= 2 {
                let key = parts[0].trim();
                if let Some(new_value) = updates.get(key) {
                    let value_and_comment = parts[1].trim();
                    let suffix = if let Some(comment_pos) = find_comment(value_and_comment) {
                        let comment = &value_and_comment[comment_pos..];
                        format!("  {}", comment)
                    } else {
                        String::new()
                    };
                    *line = format!("set {} {}{}", key, new_value, suffix);
                }
            }
        }
        let _ = i; // suppress unused warning
    }

    lines.join("\n")
}

#[tauri::command]
fn load_config(path: String) -> Result<ParsedConfig, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(parse_config(&content))
}

#[tauri::command]
fn save_config(path: String, raw_lines: Vec<String>, updates: HashMap<String, String>) -> Result<(), String> {
    // Create a backup next to the original file, but only if one doesn't exist yet
    let original = PathBuf::from(&path);
    let backup = original
        .parent()
        .unwrap_or_else(|| std::path::Path::new("."))
        .join("falcon bms backup.cfg");
 
    if !backup.exists() {
        fs::copy(&original, &backup).map_err(|e| format!("Backup failed: {}", e))?;
    }
 
    // Write the updated config
    let new_content = rebuild_config(&raw_lines, &updates);
    fs::write(&path, new_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_default_config_path() -> String {
    // Common Falcon BMS install paths
    let candidates = vec![
        r"C:\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"D:\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"E:\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        
        r"C:\Program Files\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"D:\Program Files\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"E:\Program Files\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        
        r"C:\Games\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"D:\Games\Falcon BMS 4.38\User\Config\falcon bms.cfg",
        r"E:\Games\Falcon BMS 4.38\User\Config\falcon bms.cfg",
                
        r"C:\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"D:\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"E:\Falcon BMS 4.37\User\Config\falcon bms.cfg",

        r"C:\Program Files\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"D:\Program Files\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"E:\Program Files\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        
        r"C:\Games\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"D:\Games\Falcon BMS 4.37\User\Config\falcon bms.cfg",
        r"E:\Games\Falcon BMS 4.37\User\Config\falcon bms.cfg",
    ];
    for c in candidates {
        if PathBuf::from(c).exists() {
            return c.to_string();
        }
    }
    String::new()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_default_config_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
