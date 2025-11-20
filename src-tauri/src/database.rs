use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::env;
use directories::ProjectDirs;

/// Determine database file path.
/// Uses the system's local data directory (e.g., AppData/Roaming on Windows,
/// Application Support on macOS) to ensure write permissions.
fn get_db_path() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "qc", "imagechecker") {
        let data_dir = proj_dirs.data_dir();
        return data_dir.join("qc_analytics.sqlite");
    }
    // Fallback: current working directory
    Path::new("qc_analytics.sqlite").to_path_buf()
}

fn open_connection() -> Result<Connection, String> {
    let db_path = get_db_path();

    if let Some(parent) = db_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create database directory: {}", e));
        }
    }

    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

/// Initialize database and create tables if they do not exist.
#[tauri::command]
pub fn init_database(_base_directory: String) -> Result<(), String> {
    let conn = open_connection()?;

    let schema = r#"
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS qc_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qc_name TEXT NOT NULL,
            folder_path TEXT NOT NULL,
            session_start TEXT NOT NULL DEFAULT (datetime('now')),
            session_end TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS qc_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            week_number TEXT,
            qc_date TEXT,
            received_date TEXT,
            namespace TEXT,
            filename TEXT NOT NULL,
            qc_name TEXT,
            qc_decision TEXT,
            qc_observations TEXT,
            retouch_quality TEXT,
            retouch_observations TEXT,
            next_action TEXT,
            image_start_time TEXT,
            image_end_time TEXT,
            time_spent_seconds REAL,
            custom_fields_json TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(session_id, filename),
            FOREIGN KEY (session_id) REFERENCES qc_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    "#;

    conn.execute_batch(schema)
        .map_err(|e| format!("Failed to initialize database schema: {}", e))?;

    Ok(())
}

/// Payload for creating a QC session.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionPayload {
    pub qc_name: String,
    pub folder_path: String,
}

/// Start a new QC session and return its ID.
#[tauri::command]
pub fn create_session(_base_directory: String, payload: CreateSessionPayload) -> Result<i64, String> {
    let conn = open_connection()?;

    conn.execute(
        "INSERT INTO qc_sessions (qc_name, folder_path) VALUES (?1, ?2)",
        params![payload.qc_name, payload.folder_path],
    )
    .map_err(|e| format!("Failed to create session: {}", e))?;

    Ok(conn.last_insert_rowid())
}

/// Payload for saving a QC record.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveQcRecordPayload {
    pub session_id: i64,
    pub week_number: String,
    pub qc_date: String,
    pub received_date: String,
    pub namespace: String,
    pub filename: String,
    pub qc_name: String,
    pub qc_decision: String,
    pub qc_observations: String,
    pub retouch_quality: String,
    pub retouch_observations: String,
    pub next_action: String,
    pub image_start_time: Option<String>,
    pub image_end_time: Option<String>,
    pub time_spent_seconds: Option<f64>,
    pub custom_fields_json: Option<String>,
}

/// Insert or update a QC record for a given session and filename.
#[tauri::command]
pub fn save_qc_record(_base_directory: String, payload: SaveQcRecordPayload) -> Result<(), String> {
    let conn = open_connection()?;

    conn.execute(
        r#"
        INSERT INTO qc_records (
            session_id,
            week_number,
            qc_date,
            received_date,
            namespace,
            filename,
            qc_name,
            qc_decision,
            qc_observations,
            retouch_quality,
            retouch_observations,
            next_action,
            image_start_time,
            image_end_time,
            time_spent_seconds,
            custom_fields_json
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16
        )
        ON CONFLICT(session_id, filename) DO UPDATE SET
            week_number = excluded.week_number,
            qc_date = excluded.qc_date,
            received_date = excluded.received_date,
            namespace = excluded.namespace,
            qc_name = excluded.qc_name,
            qc_decision = excluded.qc_decision,
            qc_observations = excluded.qc_observations,
            retouch_quality = excluded.retouch_quality,
            retouch_observations = excluded.retouch_observations,
            next_action = excluded.next_action,
            image_start_time = excluded.image_start_time,
            image_end_time = excluded.image_end_time,
            time_spent_seconds = excluded.time_spent_seconds,
            custom_fields_json = excluded.custom_fields_json,
            updated_at = datetime('now')
        ;
        "#,
        params![
            payload.session_id,
            payload.week_number,
            payload.qc_date,
            payload.received_date,
            payload.namespace,
            payload.filename,
            payload.qc_name,
            payload.qc_decision,
            payload.qc_observations,
            payload.retouch_quality,
            payload.retouch_observations,
            payload.next_action,
            payload.image_start_time,
            payload.image_end_time,
            payload.time_spent_seconds,
            payload.custom_fields_json
        ],
    )
    .map_err(|e| format!("Failed to save QC record: {}", e))?;

    Ok(())
}

/// Simple session summary used for history views.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub id: i64,
    pub qc_name: String,
    pub folder_path: String,
    pub session_start: String,
    pub session_end: Option<String>,
    pub created_at: String,
}

/// Fetch session history for a given QC name.
#[tauri::command]
pub fn get_session_history(
    _base_directory: String,
    qc_name: String,
) -> Result<Vec<SessionSummary>, String> {
    let conn = open_connection()?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, qc_name, folder_path, session_start, session_end, created_at
            FROM qc_sessions
            WHERE qc_name = ?
            ORDER BY session_start DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare session history query: {}", e))?;

    let rows = stmt
        .query_map([qc_name], |row| {
            Ok(SessionSummary {
                id: row.get(0)?,
                qc_name: row.get(1)?,
                folder_path: row.get(2)?,
                session_start: row.get(3)?,
                session_end: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("Failed to map session history rows: {}", e))?;

    let mut sessions = Vec::new();
    for session in rows {
        sessions.push(session.map_err(|e| format!("Failed to read session row: {}", e))?);
    }

    Ok(sessions)
}

/// Very lightweight analytics summary for now.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSummary {
    pub total_images: i64,
    pub total_right: i64,
    pub total_wrong: i64,
    pub average_time_seconds: Option<f64>,
}

/// Fetch basic analytics for a QC user.
#[tauri::command]
pub fn get_analytics_data(
    _base_directory: String,
    qc_name: String,
) -> Result<AnalyticsSummary, String> {
    let conn = open_connection()?;

    // Total images and decision breakdown (≤ 8s active QC time)
    let (total_images, total_right, total_wrong) = {
        let mut stmt = conn
            .prepare(
                r#"
                SELECT
                    COUNT(*),
                    SUM(CASE WHEN qc_decision = 'Right' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN qc_decision = 'Wrong' THEN 1 ELSE 0 END)
                FROM qc_records
                WHERE qc_name = ?
                  AND time_spent_seconds IS NOT NULL
                  AND time_spent_seconds <= 8.0
            "#,
            )
            .map_err(|e| format!("Failed to prepare analytics query: {}", e))?;

        stmt.query_row([&qc_name], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })
        .map_err(|e| format!("Failed to read analytics row: {}", e))?
    };

    // Average time per image, excluding long breaks (> 60 seconds)
    let average_time_seconds = {
        let mut stmt = conn
            .prepare(
                r#"
                SELECT AVG(time_spent_seconds)
                FROM qc_records
                WHERE qc_name = ?
                  AND time_spent_seconds IS NOT NULL
                  AND time_spent_seconds <= 8.0
            "#,
            )
            .map_err(|e| format!("Failed to prepare average time query: {}", e))?;

        let avg: Option<f64> = stmt
            .query_row([qc_name], |row| row.get(0))
            .map_err(|e| format!("Failed to read average time row: {}", e))?;

        avg
    };

    Ok(AnalyticsSummary {
        total_images,
        total_right,
        total_wrong,
        average_time_seconds,
    })
}

/// Lightweight record used by the frontend to build charts.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsRecord {
    pub qc_date: Option<String>,
    pub filename: String,
    pub qc_decision: Option<String>,
    pub next_action: Option<String>,
    pub time_spent_seconds: Option<f64>,
    pub qc_observations: Option<String>,
}

/// Return all QC records for a given user so the frontend can build
/// daily charts, distributions, etc.
#[tauri::command]
pub fn get_analytics_records(
    _base_directory: String,
    qc_name: String,
) -> Result<Vec<AnalyticsRecord>, String> {
    let conn = open_connection()?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT
              qc_date,
              filename,
              qc_decision,
              next_action,
              time_spent_seconds,
              qc_observations
            FROM qc_records
            WHERE qc_name = ?
              AND time_spent_seconds IS NOT NULL
              AND time_spent_seconds <= 8.0
            ORDER BY qc_date
        "#,
        )
        .map_err(|e| format!("Failed to prepare analytics records query: {}", e))?;

    let rows = stmt
        .query_map([qc_name], |row| {
            Ok(AnalyticsRecord {
                qc_date: row.get(0).ok(),
                filename: row.get(1)?,
                qc_decision: row.get(2).ok(),
                next_action: row.get(3).ok(),
                time_spent_seconds: row.get(4).ok(),
                qc_observations: row.get(5).ok(),
            })
        })
        .map_err(|e| format!("Failed to map analytics record rows: {}", e))?;

    let mut records = Vec::new();
    for record in rows {
        records.push(record.map_err(|e| format!("Failed to read analytics record row: {}", e))?);
    }

    Ok(records)
}

/// Simple key/value settings used for custom cards, observations,
/// layouts, colors, etc.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSetting {
    pub key: String,
    pub value: String,
}

#[tauri::command]
pub fn save_app_setting(key: String, value: String) -> Result<(), String> {
    let conn = open_connection()?;

    conn.execute(
        r#"
        INSERT INTO app_settings (key, value)
        VALUES (?1, ?2)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = datetime('now')
        "#,
        params![key, value],
    )
    .map_err(|e| format!("Failed to save app setting: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn load_app_settings() -> Result<Vec<AppSetting>, String> {
    let conn = open_connection()?;

    let mut stmt = conn
        .prepare("SELECT key, value FROM app_settings")
        .map_err(|e| format!("Failed to prepare app settings query: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AppSetting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })
        .map_err(|e| format!("Failed to map app settings rows: {}", e))?;

    let mut settings = Vec::new();
    for setting in rows {
        settings.push(setting.map_err(|e| format!("Failed to read app setting row: {}", e))?);
    }

    Ok(settings)
}

/// Return the absolute path to the SQLite database file.
#[tauri::command]
pub fn get_database_path() -> String {
    let path = get_db_path();
    println!("QC Analytics database path: {}", path.display());
    path.display().to_string()
}
