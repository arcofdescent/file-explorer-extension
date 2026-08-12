// Re-renders Chrome's native file:// directory listing as a cleaner,
// sortable UI. Chrome's built-in listing renders a bare <table> (no id)
// whose header row has id="theader"; by document_end/idle time the rows
// already exist.

let rootEntries = [];
let parentHref = null;
let sortState = { key: "name", dir: 1 };

const ICONS = {
  folder:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
  file:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  up:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>',
};

(function main() {
  if (window.top !== window) return;

  const table = document.querySelector("table");
  if (!table || !document.getElementById("theader")) return; // not a directory listing — leave it alone

  const parentLink = document.getElementById("parentDirLink");
  parentHref = parentLink ? parentLink.getAttribute("href") : null;

  rootEntries = parseEntries(table);
  renderApp();
})();

function parseEntries(table) {
  const rows = Array.from(table.querySelectorAll("tr")).filter(
    (tr) => tr.querySelector("a")
  );

  return rows
    .map((tr) => {
      const link = tr.querySelector("a");
      const cells = Array.from(tr.querySelectorAll("td"));
      const isDir = link.classList.contains("dir");
      const name = link.textContent.trim().replace(/\/$/, "");
      return {
        name,
        href: link.getAttribute("href"),
        isDir,
        size: (cells[1] && cells[1].textContent.trim()) || "",
        sizeValue: Number((cells[1] && cells[1].dataset.value) || 0),
        modified: (cells[2] && cells[2].textContent.trim()) || "",
        modifiedValue: Number((cells[2] && cells[2].dataset.value) || 0),
      };
    })
    .filter((e) => e.name !== "..");
}

function buildBreadcrumbs() {
  const path = decodeURIComponent(location.pathname);
  const parts = path.split("/").filter(Boolean);
  const crumbs = [{ name: "file:///", href: "file:///" }];

  let acc = "";
  for (const part of parts) {
    acc += part + "/";
    crumbs.push({ name: part, href: "file:///" + acc });
  }
  return crumbs;
}

function sortEntries(entries) {
  const { key, dir } = sortState;
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    let cmp;
    if (key === "size") cmp = a.sizeValue - b.sizeValue;
    else if (key === "modified") cmp = a.modifiedValue - b.modifiedValue;
    else cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return cmp * dir;
  });
}

function renderApp() {
  document.title = "Files — " + decodeURIComponent(location.pathname);
  document.body.innerHTML = "";
  document.body.className = "tidy-files";

  const app = document.createElement("div");
  app.className = "tf-app";

  app.appendChild(renderBreadcrumbs());
  app.appendChild(renderColumnHeader());
  app.appendChild(renderList(rootEntries));

  document.body.appendChild(app);
}

function renderBreadcrumbs() {
  const nav = document.createElement("nav");
  nav.className = "tf-breadcrumbs";

  buildBreadcrumbs().forEach((crumb, i, arr) => {
    const a = document.createElement("a");
    a.href = crumb.href;
    a.textContent = crumb.name;
    nav.appendChild(a);
    if (i < arr.length - 1) {
      const sep = document.createElement("span");
      sep.className = "tf-sep";
      sep.textContent = "/";
      nav.appendChild(sep);
    }
  });

  return nav;
}

function renderColumnHeader() {
  const header = document.createElement("div");
  header.className = "tf-col-header";

  [
    { key: "name", label: "Name" },
    { key: "size", label: "Size" },
    { key: "modified", label: "Modified" },
  ].forEach(({ key, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "tf-col-btn tf-col-" + key + (sortState.key === key ? " tf-col-active" : "");
    const arrow = sortState.key === key ? (sortState.dir === 1 ? " ▲" : " ▼") : "";
    btn.textContent = label + arrow;
    btn.addEventListener("click", () => {
      if (sortState.key === key) sortState = { key, dir: sortState.dir * -1 };
      else sortState = { key, dir: 1 };
      renderApp();
    });
    header.appendChild(btn);
  });

  return header;
}

function renderList(entries) {
  const list = document.createElement("ul");
  list.className = "tf-list";

  if (parentHref) {
    list.appendChild(
      renderRow({ name: "..", href: parentHref, isDir: true, size: "", modified: "" }, true)
    );
  }

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "tf-empty";
    empty.textContent = "This folder is empty.";
    list.appendChild(empty);
    return list;
  }

  for (const entry of sortEntries(entries)) {
    list.appendChild(renderRow(entry));
  }

  return list;
}

function renderRow(entry, isParent) {
  const li = document.createElement("li");
  li.className = "tf-row" + (entry.isDir ? " tf-dir" : " tf-file") + (isParent ? " tf-parent" : "");

  const a = document.createElement("a");
  a.href = entry.href;

  const icon = document.createElement("span");
  icon.className = "tf-icon" + (entry.isDir && !isParent ? " tf-icon-dir" : "");
  icon.innerHTML = ICONS[isParent ? "up" : entry.isDir ? "folder" : "file"];

  const name = document.createElement("span");
  name.className = "tf-name";
  name.textContent = entry.name;

  const size = document.createElement("span");
  size.className = "tf-size";
  size.textContent = entry.isDir ? "" : entry.size;

  const modified = document.createElement("span");
  modified.className = "tf-modified";
  modified.textContent = entry.modified;

  a.appendChild(icon);
  a.appendChild(name);
  a.appendChild(size);
  a.appendChild(modified);
  li.appendChild(a);

  return li;
}
