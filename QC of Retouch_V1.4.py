import os
import csv
import json
import tkinter as tk
from tkinter import ttk, filedialog
from PIL import Image, ImageTk
import tkinter.messagebox
import subprocess
import platform
import shutil
import datetime
import pytz
from datetime import timezone
import re
import time
from tkinter import Tk

class ToolTip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text    
        self.tipwindow = None
        widget.bind("<Enter>", self.enter)
        widget.bind("<Leave>", self.leave)

    def enter(self, event=None):
        self.showtip()

    def leave(self, event=None):
        self.hidetip()

    def showtip(self):
        if self.tipwindow or not self.text:
            return
        x, y, cx, cy = self.widget.bbox("insert")
        x = x + self.widget.winfo_rootx() + 25
        y = y + cy + self.widget.winfo_rooty() + 25
        self.tipwindow = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(1)
        tw.wm_geometry("+%d+%d" % (x, y))
        label = tk.Label(tw, text=self.text, justify=tk.LEFT,
                         background="#ffffe0", relief=tk.SOLID, borderwidth=1,
                         font=("tahoma", "8", "normal"))
        label.pack(ipadx=1)

    def hidetip(self):
        tw = self.tipwindow
        self.tipwindow = None
        if tw:
            tw.destroy()

# Constants for QC Observations and Retouch Reasons
QC_OBSERVATIONS_OPTIONS = [
    "Outline",
    "Shadow",
    "Perspective",
    "License Plate",
    "Background",
    "Comment"
]

RETUCH_REASONS_OPTIONS = QC_OBSERVATIONS_OPTIONS.copy()

CSV_HEADERS = [
    'Week Number',
    'QC Date',
    'Received Date',
    'Namespace',
    'Filename',
    'QC Name',
    'QC Decision',
    'QC Observations',
    'Retouch Quality',
    'Retouch Observations',
    'Next Action'
]

def get_image_files(root_directory):
    image_files = []
    try:
        # Only look in the immediate directory, not subdirectories
        for file in os.listdir(root_directory):
            if file.lower().endswith('.jpg'):
                file_path = os.path.join(root_directory, file)
                if os.path.isfile(file_path):
                    image_files.append(file_path)
    except Exception as e:
        print(f"Error retrieving image files from directory '{root_directory}': {e}")
    return sorted(image_files)

def load_existing_csv(output_dir, week_num, date, qc_name, namespace):
    # First check if there's a state file to get the existing CSV filename
    state_file_path = os.path.join(output_dir, f"{week_num}-{date}-{namespace}_state.json")
    csv_filename = None

    if os.path.exists(state_file_path):
        try:
            with open(state_file_path, 'r') as f:
                state = json.load(f)
                csv_filename = state.get('csv_filename')
        except Exception as e:
            print(f"Error reading state file: {e}")

    # If no existing CSV filename found in state, create a new one
    if not csv_filename:
        utc_now = datetime.datetime.now(timezone.utc)
        formatted_datetime = utc_now.strftime('%Y-%m-%d_%H_%M')
        qc_name_safe = "".join(c for c in qc_name if c.isalnum() or c in (' ', '_', '-')).rstrip()
        csv_filename = f"{qc_name_safe}_{formatted_datetime}.CSV"

    csv_path = os.path.join(output_dir, csv_filename)

    existing_data = {}
    if os.path.exists(csv_path):
        try:
            with open(csv_path, mode='r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    key = row['Filename']
                    existing_data[key] = row
        except Exception as e:
            print(f"Error loading CSV file '{csv_path}': {e}")

    return existing_data, csv_filename

def save_to_csv(output_dir, csv_filename, data):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    csv_path = os.path.join(output_dir, csv_filename)

    try:
        with open(csv_path, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=CSV_HEADERS)
            writer.writeheader()

            valid_data = []
            for record in data:
                if (record.get('QC Decision') in ['Right', 'Wrong'] and
                    (record.get('QC Decision') == 'Wrong' or record.get('QC Observations')) and
                    record.get('Retouch Quality') in ['Good', 'Bad'] and
                    (record.get('Retouch Quality') != 'Bad' or record.get('Retouch Observations')) and
                    record.get('Next Action') in ['Retake', 'Retouch', 'Ignore', 'Blunder']):
                    complete_record = {header: record.get(header, '') for header in CSV_HEADERS}
                    valid_data.append(complete_record)

            writer.writerows(valid_data)
            print(f"Successfully saved {len(valid_data)} records to {csv_path}")
    except Exception as e:
        print(f"Error saving CSV file '{csv_path}': {e}")

def extract_date_weeknum(filename):
    # Assuming filename format: comparison-<id1>-<date>-<id2>-<rest>.jpg
    parts = filename.split('-')
    if len(parts) >= 4:
        date_str = parts[2]
        try:
            date = datetime.datetime.strptime(date_str, '%Y%m%d')
            date_formatted = date.strftime('%d/%m/%Y')
            week_num = date.isocalendar()[1]
            return date_formatted, str(week_num)
        except ValueError:
            pass
    return None, None

def extract_namespace(filename):
    """
    Extract namespace from filenames with this pattern:
    comparison-[token]-[date]-[namespace]-[uuid]-[view].jpg
    """
    # Regular expression to match the desired pattern
    match = re.match(r'^[^-]+-[^-]+-[^-]+-(.+?)-[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}', filename)
    
    if match:
        return match.group(1)  # Return the extracted namespace
    return ""

def extract_token(filename):
    """
    Extract token from filenames with this pattern:
    comparison-[token]-[date]-[namespace]-[uuid]-[view].jpg
    Example: comparison-3c96betzht9nv0dhka0c-20250409-hil-97c9958f-f012-4517-98b9-6597b579b833-rear-right
    """
    # Try different regex patterns to handle variations in filename format
    
    # Pattern 1: Look for 'comparison-' prefix
    match = re.search(r'comparison-([^-]+)-', filename)
    
    # Pattern 2: General pattern - get second segment between dashes
    if not match:
        parts = filename.split('-')
        if len(parts) >= 2:
            token = parts[1]
            print(f"Extracted token using split method: '{token}'")
            return token
    
    # Pattern 3: Fallback pattern - any segment that looks like a token (alphanumeric string)
    if not match:
        match = re.search(r'[a-zA-Z0-9]{10,}', filename)  # Find any 10+ char alphanumeric string
    
    token = "" if not match else match.group(1) if len(match.groups()) > 0 else match.group(0)
    
    # Debug print - will appear in console
    print(f"Extracted token from '{filename}': '{token}'")
    
    return token

def create_sample_csv(directory):
    """
    Create a sample LP Tokens.csv file with some example data.
    This is useful for testing and demonstration purposes.
    """
    csv_path = os.path.join(directory, 'LP Tokens.csv')
    
    if not os.path.exists(csv_path):
        print(f"Creating sample LP Tokens.csv file at: {csv_path}")
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow(['Customer Token', 'LP Required', 'Retouching Mode'])
                
                # Add some sample data
                writer.writerow(['1dc1pllonz5usdemwbhz', 'Yes', 'Standard'])  # Sample from screenshot
                writer.writerow(['3c96betzht9nv0dhka0c', 'No', 'Advanced'])  # Example from your description
                writer.writerow(['sample_token_123', 'Yes', 'Premium'])
                writer.writerow(['abc123xyz789', 'No', 'Basic'])
                writer.writerow(['testtoken54321', 'Yes', 'Standard'])
                
            print(f"Sample LP Tokens.csv file created successfully")
            return True
        except Exception as e:
            print(f"Error creating sample CSV file: {e}")
            return False
    return False

def load_lp_tokens_csv(directory):
    """
    Load LP Tokens CSV data from the specified directory.
    CSV should have 'Customer Token', 'LP Required', and 'Retouching Mode' columns.
    """
    tokens_data = {}
    
    # Try different possible filenames with different case sensitivity
    possible_filenames = [
        'LP Tokens.csv',
        'LP tokens.csv',
        'lp tokens.csv',
        'LP_Tokens.csv',
        'LP_tokens.csv',
        'lp_tokens.csv',
        'LPTokens.csv',
        'LP-Tokens.csv'
    ]
    
    found_file = False
    for filename in possible_filenames:
        csv_path = os.path.join(directory, filename)
        print(f"Looking for LP Tokens CSV at: {csv_path}")
        
        if os.path.exists(csv_path):
            found_file = True
            print(f"Found LP Tokens CSV file: {csv_path}")
            try:
                with open(csv_path, mode='r', newline='', encoding='utf-8') as file:
                    # Try to identify the delimiter by examining the first line
                    first_line = file.readline().strip()
                    file.seek(0)  # Reset file pointer to beginning
                    
                    # Check for common delimiters
                    delimiter = ','
                    if '\t' in first_line:
                        delimiter = '\t'
                        print(f"Detected tab delimiter in CSV")
                    elif ';' in first_line:
                        delimiter = ';'
                        print(f"Detected semicolon delimiter in CSV")
                    else:
                        print(f"Using comma delimiter in CSV")
                    
                    reader = csv.reader(file, delimiter=delimiter)
                    headers = next(reader)  # Read the header row
                    
                    print(f"CSV Headers: {headers}")
                    
                    # Find column indices (with more flexible matching)
                    token_idx = -1
                    lp_required_idx = -1
                    retouching_mode_idx = -1
                    
                    for i, header in enumerate(headers):
                        header_lower = header.strip().lower()
                        if 'customer' in header_lower and 'token' in header_lower:
                            token_idx = i
                            print(f"Found 'Customer Token' column at index {i}: '{header}'")
                        elif 'lp' in header_lower and 'required' in header_lower:
                            lp_required_idx = i
                            print(f"Found 'LP Required' column at index {i}: '{header}'")
                        elif 'retouching' in header_lower and 'mode' in header_lower:
                            retouching_mode_idx = i
                            print(f"Found 'Retouching Mode' column at index {i}: '{header}'")
                    
                    if token_idx != -1 and lp_required_idx != -1:
                        row_count = 0
                        for row in reader:
                            if len(row) > max(token_idx, lp_required_idx, retouching_mode_idx if retouching_mode_idx != -1 else -1):
                                token = row[token_idx].strip()
                                lp_required = row[lp_required_idx].strip()
                                
                                # Get retouching mode if available
                                retouching_mode = ""
                                if retouching_mode_idx != -1 and len(row) > retouching_mode_idx:
                                    retouching_mode = row[retouching_mode_idx].strip()
                                
                                if token:
                                    # Store both values as a dictionary
                                    tokens_data[token] = {
                                        'lp_required': lp_required,
                                        'retouching_mode': retouching_mode
                                    }
                                    row_count += 1
                                    if row_count <= 5:  # Only print the first 5 mappings to avoid flooding the console
                                        print(f"Added token mapping: {token} -> LP Required: {lp_required}, Retouching Mode: {retouching_mode}")
                        print(f"Added {row_count} token mappings from CSV")
                    else:
                        print("Could not find required columns 'Customer Token' and 'LP Required'")
                        print(f"Available headers: {headers}")
            except Exception as e:
                print(f"Error loading LP Tokens CSV file '{csv_path}': {e}")
                import traceback
                traceback.print_exc()
            break  # Exit the loop after successfully finding and processing a file
    
    if not found_file:
        print(f"No LP Tokens CSV file found in directory: {directory}")
        # Try to create a sample CSV file for testing
        if create_sample_csv(directory):
            # Try loading the newly created sample file
            csv_path = os.path.join(directory, 'LP Tokens.csv')
            if os.path.exists(csv_path):
                try:
                    with open(csv_path, mode='r', newline='', encoding='utf-8') as file:
                        reader = csv.reader(file)
                        headers = next(reader)  # Read the header row
                        
                        print(f"Sample CSV Headers: {headers}")
                        
                        # Find column indices
                        token_idx = 0  # We know it's the first column in our sample
                        lp_required_idx = 1  # We know it's the second column in our sample
                        
                        for row in reader:
                            if len(row) > 1:
                                token = row[token_idx].strip()
                                lp_required = row[lp_required_idx].strip()
                                
                                # Check if there's a retouching mode column (index 2)
                                retouching_mode = ""
                                if len(row) > 2:
                                    retouching_mode = row[2].strip()
                                
                                if token:
                                    # Store both values as a dictionary
                                    tokens_data[token] = {
                                        'lp_required': lp_required,
                                        'retouching_mode': retouching_mode
                                    }
                                    print(f"Added sample token mapping: {token} -> LP Required: {lp_required}, Retouching Mode: {retouching_mode}")
                except Exception as e:
                    print(f"Error loading sample CSV file: {e}")
        
        # List all files in the directory to help debugging
        try:
            print("Files in directory:")
            for file in os.listdir(directory):
                print(f"  - {file}")
        except Exception as e:
            print(f"Error listing directory contents: {e}")
    
    print(f"Total tokens loaded: {len(tokens_data)}")
    return tokens_data

class ImageCheckerApp:
    def __init__(self, root, image_list, csv_data, week_num, date, namespace, output_dir, qc_name, csv_filename):
        self.root = root
        self.root.title("Image QC Checker")
        # Load LP Tokens data from the script directory
        # Get the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.lp_tokens_data = load_lp_tokens_csv(script_dir)
        
        # Add event handler for window resize
        self.root.bind("<Configure>", self.on_window_resize)
        
        # Initialize entry focus tracking
        self.entry_has_focus = False
        
        # Flag to track if shortcuts should be active (disabled when comment boxes have focus)
        self.shortcuts_active = True
        
        # Flag to prevent validation popup when first loading an image
        self.first_load = True
        
        # Flag to prevent skipping ahead on initial load from saved state
        self.initial_load = False  # Start this as False until we load state
        
        # Additional flag to prevent validation on first image entirely
        self.skip_initial_validation = True
        
        # Record application start time to prevent popup on startup
        self.app_start_time = time.time()
        
        # Get screen dimensions
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        
        # Calculate dimensions based on screen size
        self.window_width = int(screen_width * 0.9)  # Use 90% of screen width
        self.window_height = int(screen_height * 0.9)  # Use 90% of screen height
        
        # Set window size and position it centered
        x_position = (screen_width - self.window_width) // 2
        y_position = (screen_height - self.window_height) // 2
        self.root.geometry(f"{self.window_width}x{self.window_height}+{x_position}+{y_position}")
        
        # Calculate image frame height - approximately 40% of window height
        self.image_frame_height = int(self.window_height * 0.4)
        self.root.geometry(f"{self.window_width}x{self.window_height}")

        # Normalize all paths to handle cross-platform issues
        self.image_list = [os.path.normpath(img) for img in image_list]
        self.full_image_list = self.image_list.copy()
        self.image_cache = {}
        self.filtered = False

        self.csv_data = csv_data
        self.week_num = week_num
        self.date = date
        self.namespace = namespace
        self.output_dir = output_dir
        self.qc_name = qc_name
        self.csv_filename = csv_filename

        self.total_images = len(self.image_list)
        self.current_image_index = 0

        # Initialize results from CSV data
        self.results = {filename: row for filename, row in self.csv_data.items()}
        self.next_action = tk.StringVar()
        self.current_mode = 'Q'

        # Use folder name for state file
        folder_name = os.path.basename(os.path.normpath(self.output_dir))
        self.state_file_path = os.path.join(
            self.output_dir, f"{folder_name}.json")

        # Load state after initializing results
        self.load_state()
        self.previous_options = None  # Store previous options
        self.create_ui()

        if self.total_images > 0:
            # Keep current_image_index as loaded from state file
            # This ensures we continue from where we left off
            self.first_load = True
            # Don't call load_next_image, just load the current image directly
            self.load_image()
        else:
            tk.messagebox.showwarning("No Images", "No images found to process.")
            self.root.destroy()

    def load_state(self):
        # Always start with a fresh load flag
        # Track if any image has been saved
        self.has_saved = False
        
        # Track if previous options have been applied
        self.has_applied_previous = False
        
        # Track entry focus state
        self.entry_has_focus = False
        
        self.first_load = True
        self.current_mode = 'Both'
        
        if os.path.exists(self.state_file_path):
            try:
                with open(self.state_file_path, 'r') as f:
                    state = json.load(f)
                    saved_image_list = state.get('image_list', [])
                    saved_results = state.get('results', {})

                    # Fix path separators for Windows compatibility
                    normalized_full_image_list = [os.path.normpath(img) for img in self.full_image_list]
                    normalized_saved_image_list = [os.path.normpath(img) for img in saved_image_list]
                    
                    # Check if the saved images match with current images (using normalized paths)
                    if normalized_saved_image_list and all(os.path.basename(img) in [os.path.basename(x) for x in normalized_full_image_list] for img in normalized_saved_image_list):
                        # Use the current full_image_list to ensure paths are correct for the current OS
                        self.image_list = self.full_image_list
                        self.total_images = len(self.image_list)

                        # Restore QC results
                        self.results = saved_results

                        # Restore current position and mode
                        saved_index = state.get('current_image_index', 0)
                        if 0 <= saved_index < self.total_images:
                            self.current_image_index = saved_index
                            # Ensure we preserve this index during initial load
                            self.initial_load = True
                        else:
                            self.current_image_index = 0
                        
                        self.current_mode = state.get('current_mode', 'Both')
                        print(f"Successfully loaded state and continuing from image {self.current_image_index+1} of {self.total_images}")
                        print(f"Restored {len(saved_results)} QC results")
                    else:
                        print("Saved image list doesn't match current images, starting fresh")

            except Exception as e:
                print(f"Error loading state file: {e}")

    def save_state(self):
        # Make sure we're saving the exact current index
        # This ensures we'll reopen at the correct position
        state = {
            'current_image_index': self.current_image_index,
            'current_mode': self.current_mode,
            'image_list': [os.path.normpath(img) for img in self.image_list],
            'results': self.results,
            'csv_filename': self.csv_filename  # Save CSV filename in state
        }
        try:
            with open(self.state_file_path, 'w') as f:
                json.dump(state, f)
                print(f"Successfully saved state: Index {self.current_image_index}, Mode {self.current_mode}")
                print(f"Saved {len(self.results)} QC results")
                print(f"State file path: {self.state_file_path}")
        except Exception as e:
            print(f"Error saving state file: {e}")

    def create_ui(self):
        
        # Create a background frame that will catch clicks
        self.background_frame = tk.Frame(self.root, bg='#f0f0f0')  # Light gray background
        self.background_frame.place(relwidth=1, relheight=1)
        self.background_frame.bind('<Button-1>', self.handle_outside_click)

        self.main_frame = tk.Frame(self.background_frame)
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        self.main_frame.bind('<Button-1>', self.handle_outside_click)
        
        # We'll handle entry focus in a more targeted way
        # No global handlers that might interfere with normal operation

        style = ttk.Style(self.root)
        style.theme_use('clam')
        # Define a highlighted style for toggled/selected buttons
        style.configure('Selected.TButton', background='#83e01e', foreground='white')
        # The default style for normal state
        style.configure('TButton', padding=6, font=('Arial', 12))

        # Add bindings to all frames to handle outside clicks
        # Increase image frame height to 50% of window height for larger images
        self.image_frame_height = int(self.window_height * 0.6)  # Increased to 60% of window height
        self.image_frame = tk.Frame(self.main_frame, height=self.image_frame_height, width=self.window_width)
        self.image_frame.bind('<Button-1>', self.handle_outside_click)
        self.image_frame.pack(fill=tk.BOTH, expand=True, padx=0, pady=0)  # Use full space with no padding
        self.image_frame.pack_propagate(False)
        
        self.image_label = tk.Label(self.image_frame, bg='#f0f0f0')
        self.image_label.pack(fill=tk.BOTH, expand=True, padx=0, pady=0)  # Fill the entire frame
        self.image_label.bind('<Double-Button-1>', self.open_image_in_default_viewer)

        self.mode_var = tk.StringVar(value='Both')  # Set default mode to 'Both'
        self.current_mode = 'Q'  # Start with QC mode active

        options_frame = tk.Frame(self.main_frame)
        options_frame.pack(fill=tk.X, pady=(10, 0))

        ttk.Radiobutton(options_frame, text="QC Mode", variable=self.mode_var,
                        value='Q', command=self.update_mode).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(options_frame, text="Retouch Mode", variable=self.mode_var,
                        value='W', command=self.update_mode).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(options_frame, text="Both Modes", variable=self.mode_var,
                        value='Both', command=self.update_mode).pack(side=tk.LEFT, padx=5)

        self.controls_frame = tk.Frame(self.main_frame)
        self.controls_frame.pack(fill=tk.X, padx=20, pady=0)
        
        # QC Frame
        self.qc_frame = tk.Frame(self.controls_frame)
        self.qc_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=0)

        self.qc_decision_label = tk.Label(self.qc_frame, text="QC Decision:", font=('Arial', 14, 'bold'))
        self.qc_decision_label.pack(anchor=tk.W, pady=(0, 2))  # Added bottom padding

        qc_decision_frame = tk.Frame(self.qc_frame)
        qc_decision_frame.pack(fill=tk.X)

        self.qc_decision = tk.StringVar()
        self.qc_decision.set(None)

        # Using ttk.Button with style
        self.qc_right_lbl = ttk.Button(qc_decision_frame, text="[Q]: Right", style='TButton')
        self.qc_right_lbl.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)  # Reduced padding
        self.qc_right_lbl.bind("<Button-1>", lambda e: self.set_qc_decision("Right"))

        self.qc_wrong_lbl = ttk.Button(qc_decision_frame, text="[W]: Wrong", style='TButton')
        self.qc_wrong_lbl.grid(row=0, column=1, sticky="nsew", padx=2, pady=2)  # Reduced padding
        self.qc_wrong_lbl.bind("<Button-1>", lambda e: self.set_qc_decision("Wrong"))

        qc_decision_frame.columnconfigure(0, weight=1)
        qc_decision_frame.columnconfigure(1, weight=1)

        qc_obs_label = tk.Label(self.qc_frame, text="QC Observations:", font=('Arial', 14, 'bold'))
        qc_obs_label.pack(anchor=tk.W, pady=(10, 0))

        self.qc_obs_vars = {}
        qc_obs_frame = tk.Frame(self.qc_frame)
        qc_obs_frame.pack(fill=tk.BOTH, expand=True)

        num_columns = 3
        for i, obs in enumerate(QC_OBSERVATIONS_OPTIONS):
            lbl_text = f"[{i+1}]: {obs}"
            btn = ttk.Button(qc_obs_frame, text=lbl_text, style='TButton')
            btn.grid(row=i // num_columns, column=i % num_columns, sticky="nsew", padx=2, pady=2)  # Reduced padding
            btn.bind("<Button-1>", lambda e, obs=obs: self.toggle_qc_obs(obs))
            self.qc_obs_vars[obs] = {'selected': False, 'label': btn}

        for i in range(num_columns):
            qc_obs_frame.columnconfigure(i, weight=1)

        self.qc_comment_var = tk.StringVar()
        self.qc_comment_entry = tk.Entry(self.qc_frame, textvariable=self.qc_comment_var, font=('Arial', 14))
        # Add focus event handlers to disable/enable shortcuts
        self.qc_comment_entry.bind("<FocusIn>", self.disable_shortcuts)
        self.qc_comment_entry.bind("<FocusOut>", self.enable_shortcuts)

        # Retouch Frame
        self.retouch_frame = tk.Frame(self.controls_frame)
        self.retouch_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=0)

        self.retouch_quality_label = tk.Label(self.retouch_frame, text="Retouch Quality:", font=('Arial', 14, 'bold'))
        self.retouch_quality_label.pack(anchor=tk.W, pady=(0, 2))  # Added bottom padding

        retouch_quality_frame = tk.Frame(self.retouch_frame)
        retouch_quality_frame.pack(fill=tk.X)

        self.retouch_quality = tk.StringVar()
        self.retouch_quality.set(None)

        # Use ttk.Button with style for retouch as well
        self.retouch_good_lbl = ttk.Button(retouch_quality_frame, text="[Q]: Good", style='TButton')
        self.retouch_good_lbl.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)  # Reduced padding
        self.retouch_good_lbl.bind("<Button-1>", lambda e: self.set_retouch_quality("Good"))

        self.retouch_bad_lbl = ttk.Button(retouch_quality_frame, text="[W]: Bad", style='TButton')
        self.retouch_bad_lbl.grid(row=0, column=1, sticky="nsew", padx=2, pady=2)  # Reduced padding
        self.retouch_bad_lbl.bind("<Button-1>", lambda e: self.set_retouch_quality("Bad"))

        retouch_quality_frame.columnconfigure(0, weight=1)
        retouch_quality_frame.columnconfigure(1, weight=1)

        retouch_obs_label = tk.Label(self.retouch_frame, text="Retouch Observations:", font=('Arial', 14, 'bold'))
        retouch_obs_label.pack(anchor=tk.W, pady=(10, 0))

        self.retouch_obs_vars = {}
        retouch_obs_frame = tk.Frame(self.retouch_frame)
        retouch_obs_frame.pack(fill=tk.BOTH, expand=True)

        for i, obs in enumerate(RETUCH_REASONS_OPTIONS):
            lbl_text = f"[{i+1}]: {obs}"
            btn = ttk.Button(retouch_obs_frame, text=lbl_text, style='TButton')
            btn.grid(row=i // num_columns, column=i % num_columns, sticky="nsew", padx=2, pady=2)  # Reduced padding
            btn.bind("<Button-1>", lambda e, obs=obs: self.toggle_retouch_obs(obs))
            self.retouch_obs_vars[obs] = {'selected': False, 'label': btn}

        for i in range(num_columns):
            retouch_obs_frame.columnconfigure(i, weight=1)

        self.retouch_comment_var = tk.StringVar()
        self.retouch_comment_entry = tk.Entry(self.retouch_frame, textvariable=self.retouch_comment_var, font=('Arial', 14))
        # Add focus event handlers to disable/enable shortcuts
        self.retouch_comment_entry.bind("<FocusIn>", self.disable_shortcuts)
        self.retouch_comment_entry.bind("<FocusOut>", self.enable_shortcuts)

        # --- Place Next Action row after controls_frame, in main_frame ---
        # After both observation frames, create a new frame in main_frame for Next Action
        next_action_row = tk.Frame(self.main_frame)
        next_action_row.pack(fill=tk.X, pady=(0, 0))

        next_action_label = tk.Label(next_action_row, text="Next Action:", font=('Arial', 14, 'bold'))
        next_action_label.pack(anchor=tk.N)

        self.next_action_frame = tk.Frame(next_action_row)
        self.next_action_frame.pack(anchor=tk.CENTER, pady=(2, 0))

        self.next_action_options = ["Retake", "Retouch", "Ignore", "Blunder"]
        shortcut_keys = {'Retake': 'A', 'Retouch': 'S', 'Ignore': 'D', 'Blunder': 'F'}

        for i, action in enumerate(self.next_action_options):
            lbl_text = f"[{shortcut_keys[action]}]: {action}"
            lbl = ttk.Button(self.next_action_frame, text=lbl_text, style='TButton', width=18)
            lbl.grid(row=0, column=i, sticky="nsew", padx=2, pady=2)
            lbl.bind("<Button-1>", lambda e, action=action: self.set_next_action(action))
            key = shortcut_keys[action].lower()
            self.root.bind_all(key, lambda e, action=action: self.set_next_action(action))

        for i in range(len(self.next_action_options)):
            self.next_action_frame.columnconfigure(i, weight=1)

        # Top navigation frame for "Incomplete" button
        top_nav_frame = tk.Frame(self.main_frame)
        top_nav_frame.pack(fill=tk.X, padx=20, pady=5)

        # Incomplete button
        self.incomplete_button = ttk.Button(top_nav_frame, text="Incomplete", command=self.show_incomplete_files)
        self.incomplete_button.pack(side=tk.LEFT)
        ToolTip(self.incomplete_button, "Toggle to show incomplete images or all images")
        # New label to display Namespace beside the Incomplete button
        self.namespace_label = tk.Label(top_nav_frame, text="", font=('Arial', 15, 'bold'))
        self.namespace_label.pack(side=tk.LEFT, padx=(10, 0))

        # Navigation controls
        nav_frame = tk.Frame(self.main_frame)
        nav_frame.pack(fill=tk.X, padx=20, pady=5)

        self.nav_entry = tk.Entry(nav_frame, width=5, font=('Arial', 14))
        self.nav_entry.pack(side=tk.LEFT, padx=(0, 5))
        # Add focus event handlers and key bindings for the navigation entry
        self.nav_entry.bind("<FocusIn>", self.entry_focus_in)
        self.nav_entry.bind("<FocusOut>", self.entry_focus_out)
        self.nav_entry.bind("<Return>", self.go_to_image)
        
        # Global click handler to manage entry focus
        self.root.bind("<Button-1>", self.handle_global_click, add='+')

        nav_button = ttk.Button(nav_frame, text="Go", command=self.go_to_image)
        nav_button.pack(side=tk.LEFT)
        ToolTip(nav_button, "Go to specified image number")

        next_button = ttk.Button(nav_frame, text="Next", command=lambda: self.next_image(None))
        next_button.pack(side=tk.LEFT, padx=(5, 0))
        ToolTip(next_button, "Go to next image")

        move_pending_button = ttk.Button(nav_frame, text="Move Pending", command=self.move_pending_files)
        move_pending_button.pack(side=tk.LEFT, padx=(5, 0))
        ToolTip(move_pending_button, "Move pending images to Pending folder")
        
        # Count frame for displaying counts
        count_frame = tk.Frame(nav_frame)
        count_frame.pack(side=tk.LEFT, padx=(10, 0))
        
        # Labels for counts, side by side
        self.retouch_count_label = tk.Label(count_frame, text="Retouch: 0", font=("Arial", 10))
        self.retouch_count_label.pack(side=tk.LEFT, padx=(2, 2))
        
        self.retake_count_label = tk.Label(count_frame, text="Retake: 0", font=("Arial", 10))
        self.retake_count_label.pack(side=tk.LEFT, padx=(2, 2))
        
        self.wrong_data_count_label = tk.Label(count_frame, text="Wrong: 0", font=("Arial", 10))
        self.wrong_data_count_label.pack(side=tk.LEFT, padx=(2, 2))

        status_frame = tk.Frame(self.main_frame)
        status_frame.pack(fill=tk.X, padx=20, pady=5)

        self.status_label = tk.Label(status_frame, text="", font=('Arial', 12))
        self.status_label.pack(side=tk.LEFT)

        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(status_frame, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, expand=True, padx=10, pady=5)

        self.bottom_frame = tk.Frame(self.main_frame)
        self.bottom_frame.pack(fill=tk.X, padx=20, pady=5)

        self.image_info_text = tk.Text(self.bottom_frame, height=1, font=('Arial', 12),
                                       bg=self.root.cget('bg'), relief='flat', highlightthickness=0)
        self.image_info_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        self.image_info_text.config(state='disabled')

        # Using tk.Button with explicit styling for better text centering
        self.save_button = tk.Button(self.bottom_frame, text="Save and Exit", 
                                  command=self.save_and_exit,
                                  font=('Arial', 9),
                                  width=15,
                                  bg='#4CAF50',
                                  fg='black',
                                  relief='raised',
                                  borderwidth=2)
        self.save_button.pack(side=tk.RIGHT, padx=10)
        ToolTip(self.save_button, "Save all data and exit")

        # Using tk.Button with explicit styling for better text centering
        self.save_only_button = tk.Button(self.bottom_frame, text="Save", 
                                       command=self.save_only,
                                       font=('Arial', 9),
                                       width=10,
                                       bg='#4CAF50',
                                       fg='black',
                                       relief='raised',
                                       borderwidth=2)
        self.save_only_button.pack(side=tk.RIGHT, padx=10)
        ToolTip(self.save_only_button, "Save all data")

        # Keyboard bindings
        self.root.bind_all('<Right>', self.next_image)
        self.root.bind_all('<Left>', self.previous_image)
        self.root.bind_all('<Home>', self.first_image)
        self.root.bind_all('<End>', self.last_image)
        self.root.bind_all('<Return>', self.go_to_image)
        self.root.bind_all('<Escape>', lambda e: self.root.destroy())

        self.root.bind_all('<Up>', self.navigate_up)
        self.root.bind_all('<Down>', self.navigate_down)
        self.root.bind_all('<Tab>', self.next_image_shortcut)

        # Bind for QC decision shortcuts (lowercase + uppercase)
        self.root.bind_all('q', self.shortcut_select_right)
        self.root.bind_all('Q', self.shortcut_select_right)
        self.root.bind_all('w', self.shortcut_select_wrong)
        self.root.bind_all('W', self.shortcut_select_wrong)

        # Number keys for toggling observations
        for i in range(1, 7):
            self.root.bind_all(str(i), self.shortcut_toggle_option)

        # Ctrl/Cmd + s for save
        # Ctrl/Cmd + Shift + S for save and exit
        if platform.system() == 'Darwin':
            self.root.bind_all('<Command-s>', self.save_only)
            self.root.bind_all('<Command-Shift-S>', self.save_and_exit)
        else:
            self.root.bind_all('<Control-s>', self.save_only)
            self.root.bind_all('<Control-Shift-S>', self.save_and_exit)

        self.root.bind_all('e', self.apply_previous_options)  # Bind 'E' key to apply previous options

        self.root.focus_set()
        self.update_mode()

    def update_mode(self):
        mode = self.mode_var.get()
        for widget in self.controls_frame.winfo_children():
            widget.pack_forget()

        if mode == 'Q':
            self.current_mode = 'Q'
            self.qc_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
        elif mode == 'W':
            self.current_mode = 'W'
            self.retouch_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
        else:
            self.qc_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
            self.retouch_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
            # Keep current_mode the same if "Both" is selected
            # but ensure we highlight whichever side was last active.

        self.root.update_idletasks()

    def navigate_up(self, event=None):
        self.current_mode = 'Q'
        self.update_mode()
        self.qc_decision_label.config(fg='blue')
        self.retouch_quality_label.config(fg='black')
        return "break"

    def navigate_down(self, event=None):
        self.current_mode = 'W'
        self.update_mode()
        self.qc_decision_label.config(fg='black')
        self.retouch_quality_label.config(fg='blue')
        return "break"

    def check_all_mandatory_fields(self):
        # Skip validation only if skip_initial_validation flag is explicitly set to True
        # and this is the very first app launch
        if hasattr(self, 'skip_initial_validation') and self.skip_initial_validation and time.time() - self.app_start_time < 5:
            return True
            
        qc_decision = self.qc_decision.get()
        qc_observations = [obs for obs, data in self.qc_obs_vars.items() if data['selected']]
        retouch_quality = self.retouch_quality.get()
        retouch_observations = [obs for obs, data in self.retouch_obs_vars.items() if data['selected']]
        next_action = self.next_action.get()

        if (qc_decision in ['Right', 'Wrong'] and
            (qc_decision == 'Wrong' or qc_observations) and
            retouch_quality in ['Good', 'Bad'] and
            (retouch_quality != 'Bad' or retouch_observations) and
            next_action in ['Retake', 'Retouch', 'Ignore', 'Blunder']):
            return True
        return False

    def set_qc_decision(self, decision, from_load=False):
        """
        Toggles or sets the QC Decision (Right/Wrong).
        Uses ttk styles for highlight.
        """
        if from_load:
            self.qc_decision.set(decision)
            if decision == "Right":
                self.qc_right_lbl.config(style='Selected.TButton')
                self.qc_wrong_lbl.config(style='TButton')
            elif decision == "Wrong":
                self.qc_wrong_lbl.config(style='Selected.TButton')
                self.qc_right_lbl.config(style='TButton')
            else:
                self.qc_right_lbl.config(style='TButton')
                self.qc_wrong_lbl.config(style='TButton')
        else:
            # If user clicks the same decision again, untoggle
            if self.qc_decision.get() == decision:
                self.qc_decision.set(None)
                self.qc_right_lbl.config(style='TButton')
                self.qc_wrong_lbl.config(style='TButton')
            else:
                self.qc_decision.set(decision)
                if decision == "Right":
                    self.qc_right_lbl.config(style='Selected.TButton')
                    self.qc_wrong_lbl.config(style='TButton')
                elif decision == "Wrong":
                    self.qc_wrong_lbl.config(style='Selected.TButton')
                    self.qc_right_lbl.config(style='TButton')
                
                # Only set the flag for user-initiated changes, not when loading data
                if not from_load:
                    self.skip_validation_for_auto = True

    def toggle_qc_obs(self, obs):
        data = self.qc_obs_vars[obs]
        data['selected'] = not data['selected']
        if data['selected']:
            data['label'].config(style='Selected.TButton')
            if obs == "Comment":
                self.qc_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                self.qc_comment_entry.focus_set()
        else:
            data['label'].config(style='TButton')
            if obs == "Comment":
                self.qc_comment_var.set('')
                self.qc_comment_entry.pack_forget()

    def set_retouch_quality(self, quality, from_load=False):
        """
        Toggles or sets the Retouch Quality (Good/Bad).
        Uses ttk styles for highlight.
        """
        if from_load:
            self.retouch_quality.set(quality)
            if quality == "Good":
                self.retouch_good_lbl.config(style='Selected.TButton')
                self.retouch_bad_lbl.config(style='TButton')
            elif quality == "Bad":
                self.retouch_bad_lbl.config(style='Selected.TButton')
                self.retouch_good_lbl.config(style='TButton')
            else:
                self.retouch_good_lbl.config(style='TButton')
                self.retouch_bad_lbl.config(style='TButton')
        else:
            # If user clicks the same quality again, untoggle
            if self.retouch_quality.get() == quality:
                self.retouch_quality.set(None)
                self.retouch_good_lbl.config(style='TButton')
                self.retouch_bad_lbl.config(style='TButton')
            else:
                self.retouch_quality.set(quality)
                if quality == "Good":
                    self.retouch_good_lbl.config(style='Selected.TButton')
                    self.retouch_bad_lbl.config(style='TButton')
                    self.next_action.set("Ignore")
                    for child in self.next_action_frame.winfo_children():
                        if "Ignore" in child.cget("text"):
                            child.config(style='Selected.TButton')
                        else:
                            child.config(style='TButton')
                    # Set flag only for user-initiated changes
                    if not from_load and self.check_all_mandatory_fields():
                        self.root.after(100, self.next_image)
                elif quality == "Bad":
                    self.retouch_bad_lbl.config(style='Selected.TButton')
                    self.retouch_good_lbl.config(style='TButton')
                    # Set flag only for user-initiated changes
                    if not from_load and self.check_all_mandatory_fields():
                        self.root.after(100, self.next_image)


    def toggle_retouch_obs(self, obs):
        data = self.retouch_obs_vars[obs]
        data['selected'] = not data['selected']
        if data['selected']:
            data['label'].config(style='Selected.TButton')
            if obs == "Comment":
                self.retouch_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                self.retouch_comment_entry.focus_set()
        else:
            data['label'].config(style='TButton')
            if obs == "Comment":
                self.retouch_comment_var.set('')
                self.retouch_comment_entry.pack_forget()

    def set_next_action(self, action):
        if self.next_action.get() == action:
            self.next_action.set(None)
            for child in self.next_action_frame.winfo_children():
                child.config(style='TButton')
        else:
            self.next_action.set(action)
            for child in self.next_action_frame.winfo_children():
                if action in child.cget("text"):
                    child.config(style='Selected.TButton')
                else:
                    child.config(style='TButton')
            
            # Only proceed if all mandatory fields are filled
            if self.check_all_mandatory_fields():
                # Set the flag before navigating
                self.skip_validation_for_auto = True
                self.root.after(100, self.next_image)

    def shortcut_select_right(self, event=None):
        if self.current_mode == 'Q':
            self.set_qc_decision("Right")
        elif self.current_mode == 'W':
            self.set_retouch_quality("Good")

    def shortcut_select_wrong(self, event=None):
        if self.current_mode == 'Q':
            self.set_qc_decision("Wrong")
        elif self.current_mode == 'W':
            self.set_retouch_quality("Bad")

    def shortcut_toggle_option(self, event):
        key = event.char
        if key in '123456':
            index = int(key) - 1
            if self.current_mode == 'Q':
                if index < len(QC_OBSERVATIONS_OPTIONS):
                    obs = QC_OBSERVATIONS_OPTIONS[index]
                    self.toggle_qc_obs(obs)
            elif self.current_mode == 'W':
                if index < len(RETUCH_REASONS_OPTIONS):
                    obs = RETUCH_REASONS_OPTIONS[index]
                    self.toggle_retouch_obs(obs)

    def next_image_shortcut(self, event=None):
        self.next_image()
        return "break"

    def go_to_image(self, event=None):
        try:
            target_index = int(self.nav_entry.get()) - 1
            if 0 <= target_index < self.total_images:
                self.save_current_data()
                self.save_only()
                self.current_image_index = target_index
                self.current_mode = 'Q'
                self.update_mode()
                self.load_image()
            else:
                tk.messagebox.showwarning("Invalid Input", f"Please enter a number between 1 and {self.total_images}.")
        except ValueError:
            tk.messagebox.showwarning("Invalid Input", "Please enter a valid number.")

    def update_progress(self):
        completed = 0
        total = len(self.full_image_list)
        for fname in self.full_image_list:
            filename = os.path.basename(fname)
            if filename in self.results:
                record = self.results[filename]
                # Modified condition to match our earlier change: QC Observations not required when QC Decision is Wrong
                if (record.get('QC Decision') in ['Right', 'Wrong'] and
                    (record.get('QC Decision') == 'Wrong' or record.get('QC Observations')) and
                    record.get('Retouch Quality') in ['Good', 'Bad'] and
                    (record.get('Retouch Quality') != 'Bad' or record.get('Retouch Observations')) and
                    record.get('Next Action') in ['Retake', 'Retouch', 'Ignore', 'Blunder']):
                    completed += 1

        self.status_label.config(text=f"Completed {completed} out of {total} images")
        progress_percent = (completed / total) * 100 if total > 0 else 0
        self.progress_var.set(progress_percent)

    def load_image(self):
        if self.total_images == 0:
            return
        if self.current_image_index >= self.total_images:
            self.current_image_index = 0

        # Reset the validation flags when loading a new image
        self.skip_validation_for_auto = False
        
        current_file = self.image_list[self.current_image_index]
        image_name = os.path.basename(current_file)
        current_namespace = extract_namespace(image_name)

        try:
            # Update image frame dimensions based on current window size
            self.window_width = self.root.winfo_width()
            self.window_height = self.root.winfo_height()
            self.image_frame_height = int(self.window_height * 0.5)  # Use 50% of window height for images
            
            self.image_frame.configure(height=self.image_frame_height, width=self.window_width)
            
            if current_file in self.image_cache:
                tk_image = self.image_cache[current_file]
            else:
                pil_image = Image.open(current_file)
                
                # Calculate max dimensions based on the current window size
                # Use 100% of frame width and 100% of frame height to maximize image size
                max_width = int(self.window_width)   # Use full width
                max_height = int(self.image_frame_height)  # Use full height
                
                img_width, img_height = pil_image.size
                
                # First try to fit the image to the full width
                width_scale = max_width / img_width
                height_after_width_scale = img_height * width_scale
                
                # If the height would exceed the frame, use height-based scaling instead
                if height_after_width_scale > max_height:
                    scale_factor = max_height / img_height
                else:
                    # Otherwise use the width-based scaling to fill the width
                    scale_factor = width_scale
                    
                # Apply the scaling
                new_size = (int(img_width * scale_factor), int(img_height * scale_factor))
                pil_image = pil_image.resize(new_size, Image.LANCZOS)
                tk_image = ImageTk.PhotoImage(pil_image)
                self.image_cache[current_file] = tk_image

            self.image_label.config(image=tk_image)
            self.image_label.image = tk_image

            image_count_text = f"{self.current_image_index + 1} out of {self.total_images}"
            # Removed duplicate namespace info since it's already shown in namespace_label
            image_info_text = f"{image_count_text} | {image_name}"
            self.image_info_text.config(state='normal')
            self.image_info_text.delete(1.0, tk.END)
            self.image_info_text.insert(tk.END, image_info_text)
            self.image_info_text.config(state='disabled')
            
            # Extract token from filename
            token = extract_token(image_name)
            print(f"\n==================================")
            print(f"PROCESSING IMAGE: {image_name}")
            print(f"EXTRACTED TOKEN: '{token}'")
            print(f"LOADED TOKENS: {list(self.lp_tokens_data.keys())[:5]} ... (total: {len(self.lp_tokens_data)})")
            
            # Check if token exists in LP Tokens data
            lp_required = ""
            retouching_mode = ""
            if token and token in self.lp_tokens_data:
                lp_required = self.lp_tokens_data[token]['lp_required']
                retouching_mode = self.lp_tokens_data[token]['retouching_mode']
                print(f"MATCH FOUND! Token '{token}' -> LP Required: '{lp_required}', Retouching Mode: '{retouching_mode}'")
            else:
                print(f"NO MATCH FOUND for token: '{token}'")
                
            # Display namespace with LP Required and Retouching Mode if available
            if lp_required:
                # For normal display, construct the text parts
                namespace_part = f"Namespace: {current_namespace}"
                separator = " | "
                lp_required_prefix = "LP Required: "
                
                # Set up the base label with normal styling and middle alignment
                self.namespace_label.config(
                    fg='black',
                    bg='#f0f0f0',  # Default background color
                    font=('Arial', 12, 'normal'),
                    justify='center',  # Center-align text
                    anchor='center'    # Middle alignment
                )
                
                # Check if LP Required is 'Yes' to highlight only that part
                if lp_required.lower() == 'yes':
                    # Construct full display text with normal and highlighted parts
                    full_text = namespace_part + lp_required_prefix + lp_required
                    
                    # Create a new frame to contain mixed styling
                    if not hasattr(self, 'highlight_frame'):
                        self.highlight_frame = tk.Frame(self.namespace_label.master)
                        self.highlight_frame.pack(side=tk.LEFT, padx=(10, 0))
                        
                        # Create label for the normal part
                        self.normal_part_label = tk.Label(
                            self.highlight_frame,
                            font=('Arial', 12, 'normal'),
                            anchor='center'
                        )
                        self.normal_part_label.pack(side=tk.LEFT)
                        
                        # Create label for the highlighted part
                        self.highlight_part_label = tk.Label(
                            self.highlight_frame,
                            font=('Arial', 12, 'bold'),
                            fg='white',
                            bg='orange',
                            anchor='center'
                        )
                        self.highlight_part_label.pack(side=tk.LEFT)
                        
                        # Create label for the third part (retouching mode)
                        self.third_part_label = tk.Label(
                            self.highlight_frame,
                            font=('Arial', 12, 'normal'),
                            anchor='center'
                        )
                        self.third_part_label.pack(side=tk.LEFT)
                    
                    # Update the label contents
                    self.normal_part_label.config(text=namespace_part + separator)
                    self.highlight_part_label.config(text=lp_required_prefix + lp_required)
                    
                    # Hide the original namespace label
                    self.namespace_label.pack_forget()
                    
                    # Show the highlight frame
                    self.highlight_frame.pack(side=tk.LEFT, padx=(10, 0))
                    
                    # Add retouching mode if available
                    if retouching_mode:
                        self.third_part_label.config(text=f"{separator}{retouching_mode}")
                        self.third_part_label.pack(side=tk.LEFT)
                    else:
                        self.third_part_label.pack_forget()
                else:
                    # Regular styling for non-'Yes' values - just use the normal label
                    if hasattr(self, 'highlight_frame'):
                        self.highlight_frame.pack_forget()
                    
                    # Show the normal namespace label with all text
                    self.namespace_label.pack(side=tk.LEFT, padx=(10, 0))
                    
                    # Build the full text
                    full_text = namespace_part + separator + lp_required_prefix + lp_required
                    if retouching_mode:
                        full_text += f"{separator}{retouching_mode}"
                        
                    # Update the label with all text
                    self.namespace_label.config(text=full_text)
            else:
                # No LP Required data available
                if hasattr(self, 'highlight_frame'):
                    self.highlight_frame.pack_forget()
                
                # Show the normal namespace label
                self.namespace_label.pack(side=tk.LEFT, padx=(10, 0))
                self.namespace_label.config(
                    text=f"Namespace: {current_namespace}",
                    fg='black',
                    bg='#f0f0f0',  # Default background color
                    font=('Arial', 12, 'normal')
                )

            self.reset_fields()

            existing_record = self.results.get(image_name, {})
            if existing_record:
                self.load_existing_data(existing_record)

            self.current_mode = 'Q'
            self.update_mode()
            self.update_progress()

            # Set first_load flag to False after first image is loaded and return
            if self.first_load:
                print("First image loaded - disabling auto-advance for first selections")
                self.first_load = False
                # Don't return here, allow processing to continue
                
            if self.current_image_index > 0:
                # Save the options of the previous image
                previous_image_name = os.path.basename(self.image_list[self.current_image_index - 1])
                self.previous_options = self.results.get(previous_image_name, {}).copy()

        except Exception as e:
            print(f"Error loading image '{current_file}': {e}")
            # Log the full traceback for debugging
            import traceback
            print("Full error details:")
            traceback.print_exc()
            # Don't automatically go to next image - just show an error
            tk.messagebox.showerror("Error Loading Image", f"There was a problem loading this image: {str(e)}")

    def reset_fields(self):
        self.qc_decision.set(None)
        self.retouch_quality.set(None)
        self.next_action.set(None)
        self.qc_comment_var.set('')
        self.retouch_comment_var.set('')

        self.qc_right_lbl.config(style='TButton')
        self.qc_wrong_lbl.config(style='TButton')
        self.retouch_good_lbl.config(style='TButton')
        self.retouch_bad_lbl.config(style='TButton')
        for child in self.next_action_frame.winfo_children():
            child.config(style='TButton')

        for obs, data in self.qc_obs_vars.items():
            data['selected'] = False
            data['label'].config(style='TButton')
        self.qc_comment_entry.pack_forget()
        self.qc_comment_var.set('')

        for obs, data in self.retouch_obs_vars.items():
            data['selected'] = False
            data['label'].config(style='TButton')
        self.retouch_comment_entry.pack_forget()
        self.retouch_comment_var.set('')

    def load_existing_data(self, existing_record):
        qc_decision = existing_record.get('QC Decision', None)
        self.set_qc_decision(qc_decision, from_load=True)

        qc_observations = existing_record.get('QC Observations', '')
        selected_qc_obs = qc_observations.split(';') if qc_observations else []
        for obs in selected_qc_obs:
            if obs in self.qc_obs_vars:
                self.qc_obs_vars[obs]['selected'] = True
                self.qc_obs_vars[obs]['label'].config(style='Selected.TButton')
                if obs == "Comment":
                    self.qc_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                    self.qc_comment_var.set(obs)
            else:
                # If the CSV has a comment that doesn't match any known observation
                self.qc_obs_vars["Comment"]['selected'] = True
                self.qc_obs_vars["Comment"]['label'].config(style='Selected.TButton')
                self.qc_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                self.qc_comment_var.set(obs)

        retouch_quality = existing_record.get('Retouch Quality', None)
        self.set_retouch_quality(retouch_quality, from_load=True)

        retouch_observations = existing_record.get('Retouch Observations', '')
        selected_retouch_obs = retouch_observations.split(';') if retouch_observations else []
        for obs in selected_retouch_obs:
            if obs in self.retouch_obs_vars:
                self.retouch_obs_vars[obs]['selected'] = True
                self.retouch_obs_vars[obs]['label'].config(style='Selected.TButton')
                if obs == "Comment":
                    self.retouch_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                    self.retouch_comment_var.set(obs)
            else:
                # If the CSV has a comment that doesn't match any known observation
                self.retouch_obs_vars["Comment"]['selected'] = True
                self.retouch_obs_vars["Comment"]['label'].config(style='Selected.TButton')
                self.retouch_comment_entry.pack(anchor=tk.W, fill=tk.X, padx=5, pady=5)
                self.retouch_comment_var.set(obs)

        next_action = existing_record.get('Next Action', None)
        self.next_action.set(next_action)
        if next_action:
            for child in self.next_action_frame.winfo_children():
                if next_action in child.cget("text"):
                    child.config(style='Selected.TButton')
                else:
                    child.config(style='TButton')

    def save_current_data(self):
        if self.total_images == 0:
            return True

        current_file = self.image_list[self.current_image_index]
        image_name = os.path.basename(current_file)
        image_namespace = extract_namespace(image_name)

        utc_now = datetime.datetime.now(timezone.utc)
        ist_timezone = pytz.timezone('Asia/Kolkata')  # Convert to IST for timestamp
        ist_now = utc_now.astimezone(ist_timezone)
        qc_date = ist_now.strftime('%d/%m/%Y %H:%M:%S')  # DD/MM/YYYY HH:MM:SS format
        week_num = utc_now.isocalendar()[1]

        qc_decision = self.qc_decision.get()

        qc_observations = []
        for obs, data in self.qc_obs_vars.items():
            if data['selected']:
                if obs == "Comment":
                    comment_text = self.qc_comment_var.get().strip()
                    if comment_text:
                        qc_observations.append(comment_text)
                else:
                    qc_observations.append(obs)
        qc_observations_str = ';'.join(qc_observations)

        retouch_quality = self.retouch_quality.get() or ''

        retouch_observations = []
        for obs, data in self.retouch_obs_vars.items():
            if data['selected']:
                if obs == "Comment":
                    comment_text = self.retouch_comment_var.get().strip()
                    if comment_text:
                        retouch_observations.append(comment_text)
                else:
                    retouch_observations.append(obs)
        retouch_observations_str = ';'.join(retouch_observations)

        next_action = self.next_action.get() if self.next_action.get() else ''
        
        # Check if this is a new entry or an update to an existing entry
        existing_entry = self.results.get(image_name, {})
        
        # If it's an existing entry, preserve the original QC Name
        # Otherwise use the current QC name
        qc_name_to_use = existing_entry.get('QC Name', self.qc_name) if existing_entry and existing_entry.get('QC Decision') else self.qc_name
        
        # Preserve original QC Date and Week Number for existing entries
        if existing_entry and existing_entry.get('QC Date'):
            qc_date_to_use = existing_entry['QC Date']
            week_num_to_use = existing_entry.get('Week Number', str(week_num))
        else:
            qc_date_to_use = qc_date
            week_num_to_use = str(week_num)
        
        # Only update the entry if something has actually been selected/entered
        if qc_decision or qc_observations_str or retouch_quality or next_action:
            self.results[image_name] = {
                'Week Number': week_num_to_use,
                'QC Date': qc_date_to_use,
                'Received Date': self.date or '',
                'Namespace': image_namespace or '',
                'Filename': image_name,
                'QC Name': qc_name_to_use,  # Use either original or new QC name
                'QC Decision': qc_decision,
                'QC Observations': qc_observations_str,
                'Retouch Quality': retouch_quality,
                'Retouch Observations': retouch_observations_str,
                'Next Action': next_action
            }
            print(f"Saved data for {image_name} with QC Name: {qc_name_to_use}")
        
        # Update count labels after saving data
        self.update_category_counts()
        return True

    def update_category_counts(self):
        # Count Retouch, Retake, and Wrong data entries
        retouch_count = 0
        blunder_count = 0
        retake_count = 0
        wrong_data_count = 0
        
        for filename, data in self.results.items():
            next_action = data.get('Next Action', '')
            qc_decision = data.get('QC Decision', '')
            
            # Count based on Next Action for Retouch, Blunder, and Retake
            if next_action == 'Retouch':
                retouch_count += 1
            elif next_action == 'Blunder':
                blunder_count += 1
            elif next_action == 'Retake':
                retake_count += 1
            
            # Count Wrong data based on QC Decision being 'Wrong'
            if qc_decision == 'Wrong':
                wrong_data_count += 1
        
        # Update the labels - Retouch count now includes Blunder count
        combined_retouch_count = retouch_count + blunder_count
        self.retouch_count_label.config(text=f"Retouch: {combined_retouch_count}")
        self.retake_count_label.config(text=f"Retake: {retake_count}")
        self.wrong_data_count_label.config(text=f"Wrong: {wrong_data_count}")

    def next_image(self, event=None):
        # Skip validation and auto-advance during the first image load
        if self.first_load and event is None:  # Only when called programmatically (not by user action)
            self.first_load = False
            # Always proceed to load_next_image without checking mandatory fields for first programmatic call
            self.root.after(100, self.load_next_image)
            return

        # Turn off the skip_initial_validation flag after the first navigation
        if hasattr(self, 'skip_initial_validation') and self.skip_initial_validation:
            self.skip_initial_validation = False

        # Check if we should skip validation (set by selection methods)
        skip_validation = getattr(self, 'skip_validation_for_auto', False)
        
        # Reset the flag immediately to ensure it's fresh for the next operation
        self.skip_validation_for_auto = False
        
        if not skip_validation:
            if not self.check_all_mandatory_fields():
                missing_fields = []
                if self.qc_decision.get() not in ['Right', 'Wrong']:
                    missing_fields.append("QC Decision (Right or Wrong)")
                if self.qc_decision.get() == 'Right' and not any(data['selected'] for data in self.qc_obs_vars.values()):
                    missing_fields.append("QC Observations (at least one required for 'Right' decision)")
                if self.retouch_quality.get() not in ['Good', 'Bad']:
                    missing_fields.append("Retouch Quality (Good or Bad)")
                if self.retouch_quality.get() == 'Bad' and not any(obs for obs, data in self.retouch_obs_vars.items() if data['selected']):
                    missing_fields.append("Retouch Observations (required when Retouch Quality is Bad)")
                if self.next_action.get() not in ['Retake', 'Retouch', 'Ignore', 'Blunder']:
                    missing_fields.append("Next Action (Retake, Retouch, Ignore, or Blunder)")

                if missing_fields:
                    # Only show the warning if we're not in startup mode
                    current_time = time.time()
                    startup_time = getattr(self, 'app_start_time', 0)
                    time_diff = current_time - startup_time
                    if time_diff > 2:
                        tk.messagebox.showwarning(
                            "Incomplete Fields",
                            "Please complete the following required fields:\n\n" + "\n".join(missing_fields),
                            parent=self.root
                        )
                    return False

        return self.load_next_image()

    def load_next_image(self):
        self.save_current_data()
        csv_data = [data for data in self.results.values() if
                    data.get('QC Decision') in ['Right', 'Wrong'] and
                    (data.get('QC Decision') == 'Wrong' or data.get('QC Observations')) and
                    data.get('Retouch Quality') in ['Good', 'Bad'] and
                    (data.get('Retouch Quality') != 'Bad' or data.get('Retouch Observations')) and
                    data.get('Next Action') in ['Retake', 'Retouch', 'Ignore', 'Blunder']]

        if csv_data:
            save_to_csv(self.output_dir, self.csv_filename, csv_data)
        self.save_state()

        # Only increment the index if this is a normal navigation action
        # We don't want to increment when initially loading from state
        if not hasattr(self, 'initial_load') or not self.initial_load:
            self.current_image_index = (self.current_image_index + 1) % self.total_images
        else:
            # Clear the initial load flag after first use
            print(f"Initial load - keeping index at {self.current_image_index}")
            self.initial_load = False
        self.current_mode = 'Q'
        self.update_mode()
        self.qc_decision_label.config(fg='blue')
        self.retouch_quality_label.config(fg='black')
        self.load_image()
        return True

    def previous_image(self, event=None):
        self.handle_outside_click(event)
        self.save_current_data()
        self.save_only()
        self.current_image_index = (self.current_image_index - 1) % self.total_images
        self.current_mode = 'Q'
        self.update_mode()
        self.load_image()

    def first_image(self, event=None):
        self.handle_outside_click(event)
        self.save_current_data()
        self.save_only()
        self.current_image_index = 0
        self.current_mode = 'Q'
        self.update_mode()
        self.load_image()

    def last_image(self, event=None):
        self.handle_outside_click(event)
        self.save_current_data()
        self.save_only()
        self.current_image_index = self.total_images - 1
        self.current_mode = 'Q'
        self.update_mode()
        self.load_image()

    def save_only(self, event=None):
        self.save_current_data()
        csv_data = [data for data in self.results.values() if data.get('QC Decision')]
        if csv_data:
            save_to_csv(self.output_dir, self.csv_filename, csv_data)
        self.save_state()
        print("Data saved successfully")

    def save_and_exit(self, event=None):
        # Make sure to save current data and state before exiting
        self.save_current_data()
        
        # Get all data that has any QC decision (including incomplete entries)
        csv_data = [data for data in self.results.values() if data.get('QC Decision')]
        
        # Save to CSV if there's any data to save
        if csv_data:
            save_to_csv(self.output_dir, self.csv_filename, csv_data)
            print(f"Saved {len(csv_data)} records before exit")
            
        # Make sure state is saved AFTER saving to CSV to ensure consistency
        self.save_state()
        
        # Copy files if needed
        self.copy_files_to_data_folder()
        
        # Exit the application
        self.root.destroy()

    def copy_files_to_data_folder(self):
        utc_now = datetime.datetime.now(timezone.utc)
        ist_timezone = pytz.timezone('Asia/Kolkata')
        ist_now = utc_now.astimezone(ist_timezone)
        formatted_datetime = ist_now.strftime('%Y-%m-%d_%H_%M')

        qc_name_safe = "".join(c for c in self.qc_name if c.isalnum() or c in (' ', '_', '-')).rstrip()
        data_folder_name = f"{qc_name_safe}_{formatted_datetime}"
        data_folder = os.path.join(self.output_dir, data_folder_name)
        os.makedirs(data_folder, exist_ok=True)

        actions_to_copy = ['Retouch', 'Retake', 'Blunder']
        files_copied = 0
        
        for filename, data in self.results.items():
            qc_decision = data.get('QC Decision')
            next_action = data.get('Next Action')
            file_path = next((f for f in self.full_image_list if os.path.basename(f) == filename), None)
            if not file_path:
                continue

            # Copy files with Next Action in the list, or files marked as Wrong
            if next_action in actions_to_copy or qc_decision == 'Wrong':
                dest_path = os.path.join(data_folder, filename)
                try:
                    shutil.copy(file_path, dest_path)
                    files_copied += 1
                except Exception as e:
                    print(f"Error copying file '{filename}' to QC folder: {e}")
        
        if files_copied > 0:
            tk.messagebox.showinfo("Files Copied", f"Copied {files_copied} files Copied to folder.")

    def open_image_in_default_viewer(self, event=None):
        current_file = self.image_list[self.current_image_index]
        try:
            if platform.system() == 'Windows':
                os.startfile(current_file)
            elif platform.system() == 'Darwin':
                subprocess.run(['open', current_file])
            else:
                subprocess.run(['xdg-open', current_file])
        except Exception as e:
            print(f"Error opening image '{current_file}': {e}")
            tk.messagebox.showerror("Error", f"Could not open image: {e}")

    def move_pending_files(self):
        self.save_current_data()
        self.save_only()

        # Collect filenames where QC Decision is not 'Right' or 'Wrong'
        incomplete_filenames = [
            os.path.basename(f) for f in self.image_list
            if os.path.basename(f) not in self.results or
            self.results[os.path.basename(f)].get('QC Decision') not in ['Right', 'Wrong']
        ]

        if incomplete_filenames:
            pending_dir = os.path.join(self.output_dir, 'Pending')
            os.makedirs(pending_dir, exist_ok=True)
            pending_files = []
            for filename in incomplete_filenames:
                file_path = next((f for f in self.image_list if os.path.basename(f) == filename), None)
                if file_path:
                    try:
                        shutil.move(file_path, pending_dir)
                        pending_files.append(filename)
                    except Exception as e:
                        print(f"Error moving file '{filename}': {e}")

            self.image_list = [f for f in self.image_list if os.path.basename(f) not in pending_files]
            self.full_image_list = [f for f in self.full_image_list if os.path.basename(f) not in pending_files]
            self.total_images = len(self.image_list)

            for filename in pending_files:
                if filename in self.results:
                    del self.results[filename]

            if self.current_image_index >= self.total_images:
                self.current_image_index = 0

            self.load_image()
            self.update_progress()
            tk.messagebox.showinfo("Move Pending Files", f"Moved {len(pending_files)} files to Pending folder.")
        else:
            tk.messagebox.showinfo("Move Pending Files", "No pending files to move.")

    def show_incomplete_files(self):
        if not self.filtered:
            # Save current position
            self.current_image_index_full = self.current_image_index
            # Filter image_list to only incomplete images
            incomplete_filenames = [
                fname for fname in self.full_image_list
                if os.path.basename(fname) not in self.results or
                   self.results[os.path.basename(fname)].get('QC Decision') not in ['Right', 'Wrong']
            ]
            if incomplete_filenames:
                self.image_list = incomplete_filenames
                self.total_images = len(self.image_list)
                self.current_image_index = 0
                self.filtered = True
                self.load_image()
                self.update_progress()
                first_incomplete_filename = os.path.basename(incomplete_filenames[0])
                namespace_tag = extract_namespace(first_incomplete_filename)
                self.status_label.config(text="Showing incomplete images")
                self.namespace_label.config(text=f"Namespace: {namespace_tag}")
                self.incomplete_button.config(text="Show All")
            else:
                tk.messagebox.showinfo("Incomplete Files", "All files have been completed.")
        else:
            # Reset to full image list
            self.image_list = self.full_image_list
            self.total_images = len(self.image_list)
            self.current_image_index = getattr(self, 'current_image_index_full', 0)
            self.filtered = False
            self.load_image()
            self.update_progress()
            self.status_label.config(text="Showing all images")
            self.namespace_label.config(text="")
            self.incomplete_button.config(text="Incomplete")

    def entry_focus_in(self, event=None):
        """Handle when the navigation entry gets focus"""
        # Disable shortcuts when typing in the entry
        self.disable_shortcuts()
        # Store the fact that entry has focus
        self.entry_has_focus = True
        
    def entry_focus_out(self, event=None):
        """Handle when the navigation entry loses focus"""
        # Re-enable shortcuts
        self.enable_shortcuts()
        # Track that entry no longer has focus
        self.entry_has_focus = False
        
    def handle_global_click(self, event=None):
        """Global click handler to manage entry focus"""
        # Only process if we have an event
        if not event:
            return
            
        # Get the widget that was clicked on
        clicked_widget = event.widget.winfo_containing(event.x_root, event.y_root)
        
        # If no widget was clicked or we clicked on the entry itself, return
        if not clicked_widget or clicked_widget == self.nav_entry:
            return
            
        # Store a reference to nav_button so we can check it later
        try:
            # Check if we clicked on the Go button - looking for it by its parent and text
            if (isinstance(clicked_widget, ttk.Button) and 
                clicked_widget.winfo_parent() == self.nav_entry.winfo_parent() and
                clicked_widget.cget('text') == 'Go'):
                # Let the Go button work normally - don't interfere
                return
        except:
            # If any error occurs during the check, play it safe and continue
            pass
            
        # For any other click, if the entry has focus, remove it
        if hasattr(self, 'entry_has_focus') and self.entry_has_focus:
            # Clear the entry if needed
            self.nav_entry.delete(0, tk.END)
            # Force focus to the main frame to remove cursor
            self.root.focus_set()
            # Update tracking
            self.entry_has_focus = False
    
    def handle_outside_click(self, event):
        """Handle clicks outside specific UI elements"""
        # This is a simplified version that works with our new focus handling approach
        # Most focus management is now handled by handle_global_click
        
        # We're keeping this handler for backward compatibility with existing bindings
        # but it will now do minimal work
        
        # Get the widget that was clicked on
        clicked_widget = event.widget.winfo_containing(event.x_root, event.y_root)
        
        # If we're clicking in an entry or button, let normal event handling continue
        if isinstance(clicked_widget, (tk.Entry, ttk.Button)):
            return
            
        # Otherwise, let normal event handling continue
        # The global click handler will take care of focus management
        return

    def apply_previous_options(self, event=None):
        if self.previous_options:
            self.load_existing_data(self.previous_options)
            print("Applied previous options")
        else:
            print("No previous options to apply")

    def disable_shortcuts(self, event=None):
        """Disable keyboard shortcuts when comment boxes have focus"""
        if self.shortcuts_active:
            self.shortcuts_active = False
            # Unbind keyboard shortcuts
            self.root.unbind_all('<Right>')
            self.root.unbind_all('<Left>')
            self.root.unbind_all('<Home>')
            self.root.unbind_all('<End>')
            self.root.unbind_all('<Up>')
            self.root.unbind_all('<Down>')
            self.root.unbind_all('<Tab>')
            
            # Unbind letter shortcuts
            self.root.unbind_all('q')
            self.root.unbind_all('Q')
            self.root.unbind_all('w')
            self.root.unbind_all('W')
            
            # Unbind number keys
            for i in range(1, 7):
                self.root.unbind_all(str(i))
                
            # Unbind action shortcuts
            for key in ['a', 'A', 's', 'S', 'd', 'D', 'f', 'F']:
                self.root.unbind_all(key)
                
            # Unbind e shortcut for previous options
            self.root.unbind_all('e')
            self.root.unbind_all('E')
    
    def enable_shortcuts(self, event=None):
        """Re-enable keyboard shortcuts when comment boxes lose focus"""
        if not self.shortcuts_active:
            self.shortcuts_active = True
            # Rebind navigation shortcuts
            self.root.bind_all('<Right>', self.next_image)
            self.root.bind_all('<Left>', self.previous_image)
            self.root.bind_all('<Home>', self.first_image)
            self.root.bind_all('<End>', self.last_image)
            self.root.bind_all('<Return>', self.go_to_image)
            self.root.bind_all('<Up>', self.navigate_up)
            self.root.bind_all('<Down>', self.navigate_down)
            self.root.bind_all('<Tab>', self.next_image_shortcut)
            
            # Rebind QC decision shortcuts
            self.root.bind_all('q', self.shortcut_select_right)
            self.root.bind_all('Q', self.shortcut_select_right)
            self.root.bind_all('w', self.shortcut_select_wrong)
            self.root.bind_all('W', self.shortcut_select_wrong)
            
            # Rebind number keys for observations
            for i in range(1, 7):
                self.root.bind_all(str(i), self.shortcut_toggle_option)
                
            # Rebind Next Action shortcuts
            shortcut_keys = {'Retake': 'A', 'Retouch': 'S', 'Ignore': 'D', 'Blunder': 'F'}
            for action, key in shortcut_keys.items():
                self.root.bind_all(key.lower(), lambda e, action=action: self.set_next_action(action))
                
            # Rebind e for previous options
            self.root.bind_all('e', self.apply_previous_options)
            self.root.bind_all('E', self.apply_previous_options)
            
    def on_window_resize(self, event=None):
        """ Handle window resize events to update UI elements dynamically """
        # Only respond to window resize events, not other widgets
        if event and event.widget == self.root:
            # Update dimensions based on new window size
            self.window_width = self.root.winfo_width()
            self.window_height = self.root.winfo_height()
            self.image_frame_height = int(self.window_height * 0.5)  # Use 50% of window height for images
            
            # Resize image frame
            self.image_frame.configure(height=self.image_frame_height, width=self.window_width)
            
            # Reload current image to resize it properly
            if hasattr(self, 'current_image_index') and self.total_images > 0:
                # Clear the image cache to force resize
                if self.image_list[self.current_image_index] in self.image_cache:
                    del self.image_cache[self.image_list[self.current_image_index]]
                self.load_image()

class NameInputDialog:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()

        # Create and configure the dialog window
        self.dialog = tk.Toplevel()
        self.dialog.title("Select QC Name")

        # Get screen dimensions
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - 400) // 2
        y = (screen_height - 300) // 2
        self.dialog.geometry(f"400x300+{x}+{y}")

        # Main frame with dark background
        self.frame = tk.Frame(self.dialog, bg='#2E2E2E')
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Content frame
        content_frame = tk.Frame(self.frame, bg='#2E2E2E', padx=20, pady=20)
        content_frame.pack(fill=tk.BOTH, expand=True)

        name_label = tk.Label(content_frame, text="Select Quality Checker Name:",
                              font=('Arial', 14, 'bold'), bg='#2E2E2E', fg='white')
        name_label.pack(pady=(0, 15))

        self.qc_names = [
            "Padmaja Rilkar",
            "Vignesh Shankaran",
            "Shashank BR",
            "Prerana Gouda",
            "Pavan C",
            "Sahana Basheer",
            "Justin Michael",
            "Akash GS",
            "Rakesh GR",
            "Pallavi Kumari P"
        ]

        self.name_var = tk.StringVar()
        self.name_combo = ttk.Combobox(content_frame,
                                       textvariable=self.name_var,
                                       values=self.qc_names,
                                       font=('Arial', 12),
                                       width=28,
                                       state='readonly')
        self.name_combo.pack(pady=(0, 20))

        # Create a styled button with padding for better text centering
        self.submit_button = tk.Button(content_frame, text="Submit",
                                    command=self.submit,
                                    font=('Arial', 9),
                                    width=12,
                                    bg='#4CAF50',
                                    fg='black',
                                    relief='raised',
                                    borderwidth=2)
        self.submit_button.pack(pady=5)

        self.dialog.bind('<Return>', lambda e: self.submit())
        self.name_combo.bind('<Return>', lambda e: self.submit())

        self.dialog.after(100, lambda: self.name_combo.focus())
        self.result = None

    def submit(self):
        name = self.name_var.get().strip()
        if name:
            self.result = name
            self.dialog.destroy()
            self.root.destroy()
        else:
            tk.messagebox.showwarning("Invalid Selection", "Please select a name.",
                                      parent=self.dialog)
            self.name_combo.focus()

    def show(self):
        self.dialog.wait_window()
        return self.result

def main():
    import os  # Ensure os module is available in this function
    # Get QC Name using custom dialog
    dialog = NameInputDialog()
    qc_name = dialog.show()
    if not qc_name:  # If no name was entered
        return

    # Create root for file dialog
    root = tk.Tk()
    root.withdraw()

    # Show directory selection dialog
    root_directory = tk.filedialog.askdirectory(
        title="Select Directory Containing Image Files",
        parent=root
    )

    if not root_directory:  # If no directory was selected
        root.destroy()
        return

    root.destroy()

    output_directory = root_directory
    folder_name = os.path.basename(os.path.normpath(output_directory))
    state_file_path = os.path.join(output_directory, f"{folder_name}.json")

    # Try to load existing state file first
    csv_filename = None
    if os.path.exists(state_file_path):
        try:
            with open(state_file_path, 'r') as f:
                state = json.load(f)
                csv_filename = state.get('csv_filename')
        except Exception as e:
            print(f"Error reading state file: {e}")

    image_files = get_image_files(root_directory)
    if not image_files:
        tk.messagebox.showwarning("No Images", "No image files found. Exiting.")
        return

    first_image_name = os.path.basename(image_files[0])
    date_formatted, week_num = extract_date_weeknum(first_image_name)
    if date_formatted is None or week_num is None:
        print(f"Error extracting date and week number from filename '{first_image_name}'")
        date_formatted = ''
        week_num = ''

    # First look for existing CSV files in the directory
    existing_csv_files = []
    try:
        for file in os.listdir(output_directory):
            if file.lower().endswith('.csv'):
                existing_csv_files.append(file)
        print(f"Found {len(existing_csv_files)} existing CSV files: {existing_csv_files}")
    except Exception as e:
        print(f"Error listing directory: {e}")
    
    # If we have an existing CSV filename from state, use it
    if csv_filename and os.path.exists(os.path.join(output_directory, csv_filename)):
        print(f"Using CSV filename from state file: {csv_filename}")
    # If we don't have a CSV filename from state but CSV files exist, use the first one
    elif existing_csv_files:
        csv_filename = existing_csv_files[0]
        print(f"Using existing CSV file: {csv_filename}")
    # Otherwise create a new CSV filename
    else:
        utc_now = datetime.datetime.now(timezone.utc)
        ist_timezone = pytz.timezone('Asia/Kolkata')
        ist_time = utc_now.astimezone(ist_timezone)
        formatted_datetime = ist_time.strftime('%Y-%m-%d_%H_%M')
        qc_name_safe = "".join(c for c in qc_name if c.isalnum() or c in (' ', '_', '-')).rstrip()
        csv_filename = f"{qc_name_safe}_{formatted_datetime}.CSV"
        print(f"Created new CSV filename: {csv_filename}")
    
    # Load existing data from the CSV file
    csv_path = os.path.join(output_directory, csv_filename)
    existing_data = {}
    if os.path.exists(csv_path):
        try:
            with open(csv_path, mode='r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    key = row['Filename']
                    existing_data[key] = row
            print(f"Loaded {len(existing_data)} records from {csv_path}")
        except Exception as e:
            print(f"Error loading CSV file '{csv_path}': {e}")

    namespace = ""

    main_window = tk.Tk()
    style = ttk.Style(main_window)
    style.theme_use('clam')
    main_window.title("QC Image Checker - Dynamic Layout")
    # Set the window icon for Windows builds
    import os
    icon_path = os.path.join(os.path.dirname(__file__), "QC.ico")
    if os.path.exists(icon_path):
        main_window.iconbitmap(icon_path)
    
    # Make the window resizable
    main_window.resizable(True, True)
    
    # Configure row and column weights to enable proper resizing
    main_window.grid_columnconfigure(0, weight=1)
    main_window.grid_rowconfigure(0, weight=1)
    
    app = ImageCheckerApp(main_window, image_files, existing_data, week_num,
                          date_formatted, namespace, output_directory,
                          qc_name, csv_filename)
    main_window.mainloop()

if __name__ == "__main__":
    main()