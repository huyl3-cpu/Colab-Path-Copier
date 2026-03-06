# Colab Path Copier

[🇻🇳 Tiếng Việt](README.md)

Chrome extension to quickly copy Google Colab mount paths from Google Drive.

## Features

- **Right-click menu**: Right-click on any file/folder in Google Drive to get:
  - 📄 **Copy URL File** - Copies the full Colab path including filename  
  - 📁 **Copy URL Thư Mục** - Copies the current folder's Colab path
- **Keyboard shortcut**: `Ctrl+Shift+C` to copy the selected file's path
- **Smart path detection**: Automatically reads the breadcrumb navigation
- **Non-intrusive**: Appears next to Google Drive's native context menu

## Path Format

Paths are formatted for Google Colab's Drive mount:

```
/content/drive/MyDrive/folder/subfolder/file.mp4
/content/drive/MyDrive/folder/subfolder
```

## Installation

1. Download the latest release ZIP from [Releases](https://github.com/huyl3-cpu/Colab-Path-Copier/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (top right toggle)
5. Click **"Load unpacked"**
6. Select the extracted folder
7. Done! Navigate to Google Drive and right-click on any file

## Usage

1. Go to [Google Drive](https://drive.google.com)
2. Right-click on a file or folder
3. Click **"Copy URL File"** or **"Copy URL Thư Mục"** from the menu on the right
4. Paste the path in Google Colab or ComfyUI
