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
    // PATH EXTRACTION
    // ──────────────────────────────────────────────

    /**
     * Get folder path segments using multiple strategies.
     */
    function getPathSegments() {
        // Strategy 1: Parse breadcrumb by finding "My Drive" element
        // and scanning siblings on the same row
        const fromBreadcrumb = parseBreadcrumb();
        if (fromBreadcrumb !== null) return fromBreadcrumb;

        // Strategy 2: Parse from page title
        // Google Drive titles: "foldername - Google Drive"
        return getPathFromTitle();
    }

    /**
     * Parse breadcrumb from the DOM.
     * Returns array of path segments, or null if breadcrumb not found.
     */
    function parseBreadcrumb() {
        // Step 1: Find all candidate "My Drive" elements in header area
        const candidates = [];
        const allElements = document.querySelectorAll('a, span, div, button, h1, h2');

        for (const el of allElements) {
            if (el.children.length > 2) continue;
            const text = el.textContent.trim();
            if (!MY_DRIVE_NAMES.includes(text)) continue;

            const rect = el.getBoundingClientRect();
            if (rect.top < 0 || rect.top > 120 || rect.width < 5 || rect.height < 5) continue;

            candidates.push({ el, rect });
        }

        if (candidates.length === 0) return null;

        // Step 2: For each candidate, look at its container's innerText
        // The breadcrumb container will have text like "Drive của tôi\nvideo"
        // or "Drive của tôi > video"
        for (const { el } of candidates) {
            // Walk up 1-4 levels to find the breadcrumb container
            let container = el.parentElement;
            for (let level = 0; level < 4; level++) {
                if (!container) break;

                const containerText = container.innerText || container.textContent;
                if (!containerText) { container = container.parentElement; continue; }

                // Check if this container has text BEYOND just "My Drive"
                for (const driveName of MY_DRIVE_NAMES) {
                    if (!containerText.includes(driveName)) continue;

                    const afterDrive = containerText.substring(
                        containerText.indexOf(driveName) + driveName.length
                    ).trim();

                    if (afterDrive.length > 0 && afterDrive.length < 500) {
                        // Split by newlines, ">", "›" etc.
                        const parts = afterDrive
                            .split(/[\n\r>›»\/\\]+/)
                            .map(s => s.trim())
                            .filter(s => s.length > 0 && s.length < 200);

                        // Filter out UI strings
                        const filtered = parts.filter(isLikelyPathSegment);
                        if (filtered.length > 0) return filtered;
                    }
                }

                container = container.parentElement;
            }
        }

        // If we found "My Drive" but no segments after it, we're at root
        return [];
    }

    /**
     * Fallback: get current folder name from page title.
     */
    function getPathFromTitle() {
        const title = document.title;
        const match = title.match(/^(.+?)\s*[-–—]\s*Google\s*(Drive|Диск)/i);
        if (match) {
            const name = match[1].trim();
            if (MY_DRIVE_NAMES.includes(name)) return [];
            if (name && isLikelyPathSegment(name)) return [name];
        }
        return [];
    }

    /**
     * Filter out Google Drive UI strings that are NOT folder names.
     */
    function isLikelyPathSegment(text) {
        const uiStrings = [
            // Vietnamese
            'Đã chọn', 'mục', 'phím tab', 'Bản chép lời', 'Chia sẻ',
            'Tải xuống', 'Đổi tên', 'Tạo bản sao', 'Mở bằng', 'Chuyển vào thùng rác',
            'Sắp xếp', 'Thông tin về tệp', 'Xem chi tiết', 'Xóa', 'Di chuyển đến',
            'Thêm phím tắt', 'Tạo phím tắt', 'Quản lý phiên bản',
            'Chế độ xem', 'Bộ lọc', 'Chi tiết', 'Hoạt động',
            'Mua thêm bộ nhớ', 'Nâng cấp bộ nhớ', 'Loại', 'Người', 'Nguồn',
            'Lần sửa đổi gần đây nhất', 'Tìm trong Drive',
            // English
            'selected', 'item', 'items', 'tab key', 'Transcript', 'Share',
            'Download', 'Rename', 'Make a copy', 'Open with', 'Move to trash',
            'Sort', 'File information', 'View details', 'Delete', 'Move to',
            'Add shortcut', 'Organize', 'Manage versions',
            'View', 'Filter', 'Details', 'Activity', 'Type', 'People', 'Source',
            'Last modified', 'Search in Drive',
            'Get more storage', 'Upgrade storage',
            'Ctrl', 'Alt', 'Shift', 'Enter', 'Tab',
        ];

        if (uiStrings.includes(text)) return false;
        if (/đã chọn/i.test(text)) return false;
        if (/\d+\s*(mục|items?|selected)/i.test(text)) return false;
        if (/phím/i.test(text)) return false;
        // Filter out dates like "13 thg 1 tôi"
        if (/\d+\s*thg\s*\d/i.test(text)) return false;
        // Filter out sizes like "1,7 MB", "440 KB"
        if (/^\d[\d,.]*\s*(KB|MB|GB|TB|byte)/i.test(text)) return false;

        return true;
    }

    // ──────────────────────────────────────────────
    // FILE NAME EXTRACTION
    // ──────────────────────────────────────────────

    /**
     * Clean file name by removing trailing type labels.
     */
    function cleanFileName(name) {
        if (!name) return name;

        const typeLabels = [
            'Video', 'Audio', 'Image', 'Photo', 'Folder', 'Document',
            'Spreadsheet', 'Presentation', 'Form', 'Drawing', 'PDF',
            'Archive', 'Zip', 'Text', 'Script', 'Code', 'File',
            'Shortcut', 'Google Docs', 'Google Sheets', 'Google Slides',
            'Âm thanh', 'Hình ảnh', 'Ảnh', 'Thư mục', 'Tài liệu',
            'Bảng tính', 'Bản trình bày', 'Biểu mẫu', 'Bản vẽ',
            'Tệp lưu trữ', 'Văn bản', 'Tệp', 'Phím tắt',
        ];

        for (const label of typeLabels) {
            const regex = new RegExp('\\s+' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
            if (regex.test(name)) {
                const cleaned = name.replace(regex, '').trim();
                if (cleaned.length > 0) return cleaned;
            }
        }

        return name;
    }

    /**
     * Get file name from the right-clicked element.
     * STRICT: Only walks up to actual file row elements, never to main/header.
     */
    function getItemNameFromClick(event) {
        let el = event.target;

        for (let i = 0; i < 15; i++) {
            if (!el || !el.parentElement) break;

            // STOP if we've reached too high (header, nav, banner)
            const tag = el.tagName.toLowerCase();
            if (tag === 'header' || tag === 'nav' || tag === 'body') break;
            const role = el.getAttribute('role');
            if (role === 'banner' || role === 'navigation' || role === 'main') break;

            // Check if this is an actual file/folder row
            const dataId = el.getAttribute('data-id');
            if ((role === 'row' || role === 'option' || role === 'gridcell') ||
                (dataId && el.querySelector('[data-tooltip]'))) {
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
            const role = el.getAttribute('role');
            // Only consider actual file rows, not random selected elements
            if (role === 'row' || role === 'option' || role === 'gridcell' ||
                el.getAttribute('data-id')) {
                const name = extractNameFromRow(el);
                if (name) return name;
            }
        }

        return null;
    }

    /**
     * Extract file/folder name from a row element.
     */
    function extractNameFromRow(rowEl) {
        // Strategy 1: data-tooltip (most reliable - usually just the file name)
        const tooltipEls = rowEl.querySelectorAll('[data-tooltip]');
        for (const tooltipEl of tooltipEls) {
            const name = tooltipEl.getAttribute('data-tooltip');
            if (name && name.length < 300 && name.length > 0) {
                // Make sure this isn't a button tooltip like "More actions"
                if (!isUIButtonText(name)) {
                    return cleanFileName(name);
                }
            }
        }

        // Strategy 2: First cell/column content (file name is always first column)
        // Look for the first text-bearing child that isn't metadata
        const textCandidates = [];
        const allChildren = rowEl.querySelectorAll('div, span, td');

        for (const child of allChildren) {
            if (child.children.length > 0) continue; // leaf only
            const text = child.textContent.trim();
            if (!text || text.length > 256) continue;

            const rect = child.getBoundingClientRect();
            if (rect.width < 3) continue;

            // Skip metadata: dates, sizes, owner names
            if (/^\d+\s*thg\s*\d/i.test(text)) continue; // Vietnamese dates
            if (/^\d+[\s/.-]\d+[\s/.-]\d+/.test(text)) continue; // Date patterns
            if (/^\d[\d,.]*\s*(KB|MB|GB|TB|byte)/i.test(text)) continue; // Sizes
            if (/^(tôi|me|you)$/i.test(text)) continue; // Owner
            if (text === '—' || text === '-' || text === '...') continue;

            textCandidates.push({ text, left: rect.left });
        }

        // Sort by position (leftmost = file name column)
        textCandidates.sort((a, b) => a.left - b.left);

        if (textCandidates.length > 0) {
            return cleanFileName(textCandidates[0].text);
        }

        // Strategy 3: aria-label
        const ariaLabel = rowEl.getAttribute('aria-label');
        if (ariaLabel) {
            const nameMatch = ariaLabel.match(/(?:Name|Tên):\s*(.+?)(?:,|$)/i);
            if (nameMatch) return cleanFileName(nameMatch[1].trim());
        }

        return null;
    }

    /**
     * Check if text is a UI button label, not a file name.
     */
    function isUIButtonText(text) {
        const buttonTexts = [
            'More actions', 'Thao tác khác', 'Remove', 'Xóa',
            'Share', 'Chia sẻ', 'Download', 'Tải xuống',
            'Rename', 'Đổi tên', 'Details', 'Chi tiết',
            'Open', 'Mở', 'Add', 'Thêm',
        ];
        return buttonTexts.includes(text);
    }

    // ──────────────────────────────────────────────
    // CUSTOM CONTEXT MENU
    // ──────────────────────────────────────────────

    let menuElement = null;
    let lastRightClickEvent = null;

    function findDriveContextMenu() {
        const selectors = [
            'div[role="menu"]',
            'div[role="listbox"]',
        ];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const rect = el.getBoundingClientRect();
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
      <div class="colab-path-menu-item" data-action="copy-path">
        <span class="colab-path-icon">📋</span>
        <span>Copy URL File/Folder</span>
      </div>
    `;

        document.body.appendChild(menuElement);

        const driveMenu = findDriveContextMenu();
        const myRect = menuElement.getBoundingClientRect();

        if (driveMenu) {
            const driveRect = driveMenu.getBoundingClientRect();
            let left = driveRect.right + 4;
            let top = driveRect.top;

            if (left + myRect.width > window.innerWidth) {
                left = driveRect.left - myRect.width - 4;
            }
            if (left < 0) left = window.innerWidth - myRect.width - 10;
            if (top + myRect.height > window.innerHeight) {
                top = window.innerHeight - myRect.height - 10;
            }

            menuElement.style.left = left + 'px';
            menuElement.style.top = top + 'px';
        } else {
            let left = clickX;
            let top = clickY;
            if (left + myRect.width > window.innerWidth) left = window.innerWidth - myRect.width - 10;
            if (top + myRect.height > window.innerHeight) top = window.innerHeight - myRect.height - 10;
            menuElement.style.left = left + 'px';
            menuElement.style.top = top + 'px';
        }

        menuElement.querySelectorAll('.colab-path-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleMenuAction(item.getAttribute('data-action'));
                removeMenu();
            });
        });

        setTimeout(() => {
            document.addEventListener('click', onDocClick);
            document.addEventListener('contextmenu', onDocContext);
        }, 10);
    }

    function removeMenu() {
        if (menuElement) { menuElement.remove(); menuElement = null; }
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('contextmenu', onDocContext);
    }

    function onDocClick() { removeMenu(); }
    function onDocContext() { removeMenu(); }

    // ──────────────────────────────────────────────
    // ACTIONS
    // ──────────────────────────────────────────────

    function handleMenuAction(action) {
        const pathSegments = getPathSegments();
        const folderPath = COLAB_BASE + (pathSegments.length > 0 ? '/' + pathSegments.join('/') : '');

        // Try to get file/folder name from clicked or selected item
        let itemName = null;
        if (lastRightClickEvent) {
            itemName = getItemNameFromClick(lastRightClickEvent);
        }
        if (!itemName) {
            itemName = getSelectedItemName();
        }

        const colabPath = itemName ? folderPath + '/' + itemName : folderPath;
        console.log('[ColabPathCopier] path:', colabPath);
        copyToClipboard(colabPath);
        showNotification(colabPath);
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
    // KEYBOARD SHORTCUT: Ctrl+Shift+C
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
    // RIGHT-CLICK HANDLER
    // ──────────────────────────────────────────────

    document.addEventListener('contextmenu', (e) => {
        let target = e.target;
        let isOnFileArea = false;

        for (let i = 0; i < 15; i++) {
            if (!target) break;
            const tag = target.tagName.toLowerCase();
            if (tag === 'header' || tag === 'nav' || tag === 'body') break;

            const role = target.getAttribute('role');
            if (role === 'banner' || role === 'navigation') break;

            const dataId = target.getAttribute('data-id');
            // Only match actual file list containers, NOT role="main"
            if (role === 'row' || role === 'option' || role === 'grid' ||
                role === 'listbox' || role === 'gridcell' || dataId) {
                isOnFileArea = true;
                break;
            }

            target = target.parentElement;
        }

        if (isOnFileArea) {
            lastRightClickEvent = e;
            setTimeout(() => createMenu(e.clientX, e.clientY), 200);
        }
    }, true);

    console.log('🔗 Colab Path Copier v1.1 loaded');
})();
