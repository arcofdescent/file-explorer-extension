# Tidy Files

Chrome extension that re-renders `file:///` directory listings as a clean, left-aligned, sortable UI with breadcrumbs and folder/file icons.

## Load it

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the extension's **Details** and turn on **Allow access to file URLs** (Chrome content scripts can't run on `file://` pages without this).
5. Navigate to any `file:///` folder — it should re-render automatically.

## Features

- **Sorting** — click Name/Size/Modified in the column header to sort; click again to reverse direction.
- **Left-aligned layout.**

## How it works

Chrome's built-in directory listing renders a bare `<table>` (header row `id="theader"`) into the page DOM. `src/content.js` runs after that table exists, parses the rows, and replaces the page body with a custom list + breadcrumb UI (`src/content.css`). Clicking a folder just navigates normally, so the content script re-applies on each page.

## Known limitation

Chrome treats every `file://` URL as a unique security origin and blocks `fetch`/`XHR`/iframe loads between them, even from a background service worker with "Allow access to file URLs" granted — so a fully expandable (no-navigation) tree isn't possible with content scripts + fetch alone. Real workarounds exist (briefly scraping a hidden background tab via `chrome.tabs`, or the File System Access API's `showDirectoryPicker()` for a one-time-granted recursive handle, or a native messaging host), but each adds its own permissions/UX/setup cost, so this version keeps folder clicks as plain navigation.
