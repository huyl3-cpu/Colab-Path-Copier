// content.js - Colab Path Copier for Google Drive
// Adds right-click menu to copy Colab mount paths

(function () {
    'use strict';

    const COLAB_BASE = '/content/drive/MyDrive';
    const MY_DRIVE_NAMES = [
        'My Drive', 'Drive của tôi', 'Mon Drive', 'Mi unidad',
        'マイドライブ', 'Mein Laufwerk', '내 드라이브', 'Meu Drive',
        'Il mio Drive', 'Мой диск'
    ];

    // ──────────────────────────────────────────────
    // Path extraction - BREADCRUMB ONLY approach
    // ──────────────────────────────────────────────

    /**
     * Strategy: Find the element showing "My Drive" text,
     * walk up to its breadcrumb container, then collect only
     * sibling path segment elements (not toolbar/UI text).
     */
    function getPathSegments() {
        // Step 1: Find the "My Drive" / "Drive của tôi" element
        // This is the anchor point for finding the breadcrumb
        let myDriveEl = null;

        // Strategy A: check all leaf text nodes to find "My Drive"
        const allElements = document.querySelectorAll('a, span, div, button');
        for (const el of allElements) {
            // Only consider leaf-ish elements (no or few children)
            if (el.children.length > 3) continue;

            const text = el.textContent.trim();
            if (!MY_DRIVE_NAMES.includes(text)) continue;

            // Verify this is in the breadcrumb area (top of the page, header region)
            const rect = el.getBoundingClientRect();
            if (rect.top < 0 || rect.top > 120 || rect.width < 5) continue;

            // This looks like the breadcrumb "My Drive" element
            myDriveEl = el;
            break;
        }

        if (!myDriveEl) {
            // Fallback: try to get folder name from page title
            return getPathFromTitle();
        }

        // Step 2: Walk up to find the breadcrumb container
        // The container holds all breadcrumb segments at the same level
        let container = myDriveEl.parentElement;
        const segments = [];

        // Walk up at most 5 levels to find a container that has multiple path-like children
        for (let level = 0; level < 5; level++) {
            if (!container) break;

            // Try to extract segments from this container level
            const result = extractSegmentsFromContainer(container, myDriveEl);
            if (result.length > 0) {
                return result;
            }

            container = container.parentElement;
        }

        // Step 3: If walking up didn't work, try a simpler approach
        // Look at elements that are at the same DOM level / same parent as "My Drive"
        const parent = myDriveEl.parentElement;
        if (parent) {
            const siblingTexts = [];
            let foundMyDrive = false;

            for (const child of parent.children) {
                const text = child.textContent.trim();

                if (MY_DRIVE_NAMES.includes(text)) {
                    foundMyDrive = true;
                    continue;
                }

                if (foundMyDrive && text && text !== '>' && text !== '›' &&
                    text !== '/' && text !== '\\' && text.length < 200) {
                    // Filter out common UI elements that are NOT path segments
                    if (isLikelyPathSegment(text)) {
                        siblingTexts.push(text);
                    }
                }
            }

            if (siblingTexts.length > 0) return siblingTexts;
        }

        // Final fallback: title parsing
        return getPathFromTitle();
    }

    /**
     * Extract path segments from a container element.
     * Looks for structured children that represent the breadcrumb path.
     */
    function extractSegmentsFromContainer(container, myDriveEl) {
        const segments = [];
        let foundMyDrive = false;

        // Get all interactive/text children
        const children = container.querySelectorAll('a, [role="link"], [role="button"], span, div');

        for (const child of children) {
            // Only consider elements of similar "level" to myDriveEl
            // Skip if this element contains too many children (it's a wrapper, not a segment)
            if (child.children.length > 2) continue;

            const text = child.textContent.trim();
            if (!text) continue;

            // Check if this is "My Drive"
            if (MY_DRIVE_NAMES.includes(text)) {
                foundMyDrive = true;
                continue;
            }

            if (!foundMyDrive) continue;

            // Skip separators
            if (text === '>' || text === '›' || text === '/' || text === '\\') continue;

            // Skip if the text is too long (not a folder name, probably a toolbar string)
            if (text.length > 200) continue;

            // Verify this element is visually near the "My Drive" element (same row)
            const myRect = myDriveEl.getBoundingClientRect();
            const childRect = child.getBoundingClientRect();

            // Must be on the same horizontal line (within 30px tolerance)
            if (Math.abs(childRect.top - myRect.top) > 30) continue;

            // Must be to the RIGHT of "My Drive"
            if (childRect.left < myRect.right - 5) continue;

            // Check this is a likely path segment (not toolbar text)
            if (!isLikelyPathSegment(text)) continue;

            // Avoid duplicates (parent elements containing same text)
            if (segments.includes(text)) continue;

            segments.push(text);
        }

        return segments;
    }

    /**
     * Filter out common Google Drive UI strings that get misidentified as path segments.
     */
    function isLikelyPathSegment(text) {
        const uiStrings = [
            // Vietnamese UI strings
            'Đã chọn', 'mục', 'phím tab', 'Bản chép lời', 'Chia sẻ',
            'Tải xuống', 'Đổi tên', 'Tạo bản sao', 'Mở bằng', 'Chuyển vào thùng rác',
            'Sắp xếp', 'Thông tin về tệp', 'Xem chi tiết', 'Xóa', 'Di chuyển đến',
            'Thêm phím tắt', 'Tạo phím tắt', 'Quản lý phiên bản',
            'Chế độ xem', 'Bộ lọc', 'Chi tiết', 'Hoạt động',
            'Mua thêm bộ nhớ', 'Nâng cấp bộ nhớ',
            // English UI strings  
            'selected', 'item', 'items', 'tab key', 'Transcript', 'Share',
            'Download', 'Rename', 'Make a copy', 'Open with', 'Move to trash',
            'Sort', 'File information', 'View details', 'Delete', 'Move to',
            'Add shortcut', 'Organize', 'Manage versions',
            'View', 'Filter', 'Details', 'Activity',
            'Get more storage', 'Upgrade storage',
            // Common action texts
            'Ctrl', 'Alt', 'Shift', 'Enter', 'Tab',
        ];

        // Check exact match
        if (uiStrings.includes(text)) return false;

        // Check if text contains "đã chọn" pattern like "Đã chọn 1 mục"
        if (/đã chọn/i.test(text)) return false;
        if (/\d+\s*(mục|items?|selected)/i.test(text)) return false;
        if (/phím/i.test(text)) return false;

        return true;
    }

    /**
     * Fallback: Extract folder name from page title.
     * Google Drive titles are like "video - Google Drive"
     */
    function getPathFromTitle() {
        const title = document.title;
        const match = title.match(/^(.+?)\s*[-–—]\s*Google\s*(Drive|Диск)/i);
        if (match) {
            const name = match[1].trim();
            // Check if we're at "My Drive" root
            if (MY_DRIVE_NAMES.includes(name)) return [];
            return [name]; // Only the current folder, not full path
        }
        return [];
    }

    // ──────────────────────────────────────────────
    // File/Folder name extraction
    // ──────────────────────────────────────────────

    /**
     * Get the name of the right-clicked file/folder item.
     */
    function getItemNameFromClick(event) {
        let el = event.target;

        // Walk up to find the file/folder row
        for (let i = 0; i < 20; i++) {
            if (!el) break;

            const role = el.getAttribute('role');
            const dataId = el.getAttribute('data-id');

            // Check if this is a file/folder row
            if (role === 'row' || role === 'option' || dataId) {
                return extractNameFromRow(el);
            }

            el = el.parentElement;
        }

        return null;
    }

    /**
     * Get the name of the currently selected item.
     */
    function getSelectedItemName() {
        const selected = document.querySelectorAll('[aria-selected="true"]');

        for (const el of selected) {
            const name = extractNameFromRow(el);
            if (name) return name;
        }

        return null;
    }

    /**
     * Clean file name by removing trailing type labels
     * that Google Drive appends (e.g., "12.mp4 Video" → "12.mp4")
     */
    function cleanFileName(name) {
        if (!name) return name;

        // Common file type labels Google Drive appends after the filename
        const typeLabels = [
            // English
            'Video', 'Audio', 'Image', 'Photo', 'Folder', 'Document',
            'Spreadsheet', 'Presentation', 'Form', 'Drawing', 'PDF',
            'Archive', 'Zip', 'Text', 'Script', 'Code', 'File',
            'Shortcut', 'Google Docs', 'Google Sheets', 'Google Slides',
            // Vietnamese
            'Âm thanh', 'Hình ảnh', 'Ảnh', 'Thư mục', 'Tài liệu',
            'Bảng tính', 'Bản trình bày', 'Biểu mẫu', 'Bản vẽ',
            'Tệp lưu trữ', 'Văn bản', 'Tệp', 'Phím tắt',
        ];

        // Try removing each type label from the end
        for (const label of typeLabels) {
            // Match " Label" at the end, case-insensitive
            const regex = new RegExp('\\s+' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
            if (regex.test(name)) {
                const cleaned = name.replace(regex, '').trim();
                if (cleaned.length > 0) return cleaned;
            }
        }

        return name;
    }

    /**
     * Extract the display name from a file/folder row element.
     */
    function extractNameFromRow(rowEl) {
        // Strategy 1: data-tooltip attribute (most reliable)
        const tooltipEl = rowEl.querySelector('[data-tooltip]');
        if (tooltipEl) {
            const name = tooltipEl.getAttribute('data-tooltip');
            if (name && name.length < 300) return cleanFileName(name);
        }

        // Strategy 2: aria-label on the row itself
        const ariaLabel = rowEl.getAttribute('aria-label');
        if (ariaLabel) {
            // aria-label might be like "12.mp4" or "Type: Video, Name: 12.mp4, ..."
            // Try to extract just the file name
            const nameMatch = ariaLabel.match(/(?:Name|Tên):\s*(.+?)(?:,|$)/i);
            if (nameMatch) return cleanFileName(nameMatch[1].trim());

            // If it's short, it might just be the file name
            if (ariaLabel.length < 200 && !ariaLabel.includes(',')) {
                return cleanFileName(ariaLabel.trim());
            }
        }

        // Strategy 3: Look for specific name container classes
        const nameSelectors = [
            '[data-is-doc-name]',
            '.KL4NAf',
            '[class*="name"]',
        ];

        for (const sel of nameSelectors) {
            const nameEl = rowEl.querySelector(sel);
            if (nameEl) {
                const text = nameEl.textContent.trim();
                if (text && text.length < 300) return cleanFileName(text);
            }
        }

        // Strategy 4: First text child that looks like a filename
        const divs = rowEl.querySelectorAll('div, span');
        for (const div of divs) {
            if (div.children.length > 0) continue; // leaf node only
            const text = div.textContent.trim();
            if (text && text.length > 0 && text.length < 256) {
                // Check if it looks like a filename (has extension or is a reasonable name)
                if (/\.\w{1,10}$/.test(text) || (text.length < 100 && !/\d+\s*(mục|item|byte|KB|MB|GB)/i.test(text))) {
                    return cleanFileName(text);
                }
            }
        }

        return null;
    }

    // ──────────────────────────────────────────────
    // Custom context menu overlay
    // ──────────────────────────────────────────────

    let menuElement = null;
    let lastRightClickEvent = null;

    /**
     * Find Google Drive's native context menu element.
     */
    function findDriveContextMenu() {
        // Google Drive renders its context menu as a div with role="menu"
        // or specific class names. Try multiple selectors.
        const selectors = [
            'div[role="menu"]',
            'div[role="listbox"]',
            '.ne2Ple',        // Drive context menu class
            '.z80M1',         // Alternative Drive menu class  
            '.a-d-j',         // Older Drive menu class
        ];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const rect = el.getBoundingClientRect();
                // Must be visible and reasonably sized (a context menu)
                if (rect.width > 50 && rect.height > 50 &&
                    rect.width < 500 && rect.height < 800 &&
                    el.offsetParent !== null) {
                    return el;
                }
            }
        }
        return null;
    }

    function createMenu(clickX, clickY) {
        removeMenu();

        menuElement = document.createElement('div');
        menuElement.id = 'colab-path-menu';
        menuElement.innerHTML = `
      <div class="colab-path-menu-item" data-action="copy-file">
        <span class="colab-path-icon">📄</span>
        <span>Copy URL File</span>
      </div>
      <div class="colab-path-menu-item" data-action="copy-folder">
        <span class="colab-path-icon">📁</span>
        <span>Copy URL Thư Mục</span>
      </div>
    `;

        document.body.appendChild(menuElement);

        // Try to position to the right of Google Drive's native context menu
        const driveMenu = findDriveContextMenu();
        const myRect = menuElement.getBoundingClientRect();

        if (driveMenu) {
            const driveRect = driveMenu.getBoundingClientRect();
            let left = driveRect.right + 4; // 4px gap to the right
            let top = driveRect.top;

            // If it goes off the right edge, put it to the LEFT of Drive's menu
            if (left + myRect.width > window.innerWidth) {
                left = driveRect.left - myRect.width - 4;
            }
            // If it still doesn't fit, just align to right edge of viewport
            if (left < 0) {
                left = window.innerWidth - myRect.width - 10;
            }
            // Vertical: keep within viewport
            if (top + myRect.height > window.innerHeight) {
                top = window.innerHeight - myRect.height - 10;
            }

            menuElement.style.left = left + 'px';
            menuElement.style.top = top + 'px';
        } else {
            // Fallback: position at click location if Drive menu not found
            let left = clickX;
            let top = clickY;

            if (left + myRect.width > window.innerWidth) {
                left = window.innerWidth - myRect.width - 10;
            }
            if (top + myRect.height > window.innerHeight) {
                top = window.innerHeight - myRect.height - 10;
            }

            menuElement.style.left = left + 'px';
            menuElement.style.top = top + 'px';
        }

        // Click handlers
        menuElement.querySelectorAll('.colab-path-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleMenuAction(item.getAttribute('data-action'));
                removeMenu();
            });
        });

        // Close on click elsewhere
        setTimeout(() => {
            document.addEventListener('click', onDocClick);
            document.addEventListener('contextmenu', onDocContext);
        }, 10);
    }

    function removeMenu() {
        if (menuElement) {
            menuElement.remove();
            menuElement = null;
        }
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('contextmenu', onDocContext);
    }

    function onDocClick() { removeMenu(); }
    function onDocContext() { removeMenu(); }

    // ──────────────────────────────────────────────
    // Actions
    // ──────────────────────────────────────────────

    function handleMenuAction(action) {
        const isFolder = action === 'copy-folder';
        const pathSegments = getPathSegments();
        const folderPath = COLAB_BASE + (pathSegments.length > 0 ? '/' + pathSegments.join('/') : '');

        if (isFolder) {
            copyToClipboard(folderPath);
            showNotification(folderPath);
        } else {
            // Get file name from click target or selection
            let fileName = null;
            if (lastRightClickEvent) {
                fileName = getItemNameFromClick(lastRightClickEvent);
            }
            if (!fileName) {
                fileName = getSelectedItemName();
            }

            if (!fileName) {
                showNotification('❌ Không tìm thấy tên file. Vui lòng chọn file trước.', true);
                return;
            }

            const colabPath = folderPath + '/' + fileName;
            copyToClipboard(colabPath);
            showNotification(colabPath);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    }

    function showNotification(text, isError = false) {
        const existing = document.getElementById('colab-path-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'colab-path-notification';
        if (isError) el.className = 'colab-path-error';
        el.innerHTML = `
      <div class="colab-notif-icon">${isError ? '❌' : '✅'}</div>
      <div class="colab-notif-text">
        <div class="colab-notif-title">${isError ? 'Lỗi' : 'Đã copy!'}</div>
        <div class="colab-notif-path">${text}</div>
      </div>
    `;

        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));

        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    // ──────────────────────────────────────────────
    // Keyboard shortcut: Ctrl+Shift+C
    // ──────────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            const fileName = getSelectedItemName();
            const pathSegments = getPathSegments();
            const folderPath = COLAB_BASE + (pathSegments.length > 0 ? '/' + pathSegments.join('/') : '');

            if (fileName) {
                const path = folderPath + '/' + fileName;
                copyToClipboard(path);
                showNotification(path);
            } else {
                copyToClipboard(folderPath);
                showNotification(folderPath);
            }
        }
    });

    // ──────────────────────────────────────────────
    // Right-click handler
    // ──────────────────────────────────────────────

    document.addEventListener('contextmenu', (e) => {
        // Check if click is on a file/folder item
        let target = e.target;
        let isOnFileArea = false;

        for (let i = 0; i < 15; i++) {
            if (!target) break;
            const role = target.getAttribute('role');
            const dataId = target.getAttribute('data-id');

            if (role === 'row' || role === 'option' || role === 'grid' ||
                role === 'listbox' || role === 'main' || dataId) {
                isOnFileArea = true;
                break;
            }

            target = target.parentElement;
        }

        if (isOnFileArea) {
            lastRightClickEvent = e;
            // Wait 200ms for Google Drive's native menu to render first,
            // then position our menu to its right
            setTimeout(() => createMenu(e.clientX, e.clientY), 200);
        }
    }, true);

    console.log('🔗 Colab Path Copier loaded');
})();
