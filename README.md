# Tidy Files

Chrome extension that re-renders `file:///` directory listings as a clean UI with breadcrumbs, folder/file icons, and sorted rows.

## Load it

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the extension's **Details** and turn on **Allow access to file URLs** (Chrome content scripts can't run on `file://` pages without this).
5. Navigate to any `file:///` folder — it should re-render automatically.

## How it works

Chrome's built-in directory listing renders into a `table#list` in the page DOM. `src/content.js` runs after that table exists, parses the rows, and replaces the page body with a custom list + breadcrumb UI (`src/content.css`). Clicking a folder just navigates normally, so the content script re-applies on each page.

## Known limitation

Chrome blocks `fetch`/`XHR` to `file://` URLs even from `file://` pages, so a fully expandable (no-navigation) tree isn't possible with content scripts alone. A future version could add an options page using the `chrome.fileSystem`-style native messaging or the File System Access API to build a real recursive tree.
