// Re-renders Chrome's native file:// directory listing as a cleaner UI.
// Chrome's built-in listing renders a bare <table> (no id) whose header row
// has id="theader"; by document_end/idle time the rows already exist.

(function main() {
  if (window.top !== window) return;

  const table = document.querySelector("table");
  if (!table || !document.getElementById("theader")) return; // not a directory listing — leave it alone

  const entries = parseEntries(table);
  render(entries);
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
        modified: (cells[2] && cells[2].textContent.trim()) || "",
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

function render(entries) {
  entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  document.title = "Files — " + decodeURIComponent(location.pathname);
  document.body.innerHTML = "";
  document.body.className = "tidy-files";

  const app = document.createElement("div");
  app.className = "tf-app";

  app.appendChild(renderBreadcrumbs());
  app.appendChild(renderList(entries));

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

function renderList(entries) {
  const list = document.createElement("ul");
  list.className = "tf-list";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "tf-empty";
    empty.textContent = "This folder is empty.";
    list.appendChild(empty);
    return list;
  }

  for (const entry of entries) {
    const li = document.createElement("li");
    li.className = "tf-row" + (entry.isDir ? " tf-dir" : " tf-file");

    const a = document.createElement("a");
    a.href = entry.href;

    const icon = document.createElement("span");
    icon.className = "tf-icon";
    icon.textContent = entry.isDir ? "\u{1F4C1}" : "\u{1F4C4}";

    const name = document.createElement("span");
    name.className = "tf-name";
    name.textContent = entry.name;

    const meta = document.createElement("span");
    meta.className = "tf-meta";
    meta.textContent = [entry.size, entry.modified].filter(Boolean).join(" · ");

    a.appendChild(icon);
    a.appendChild(name);
    a.appendChild(meta);
    li.appendChild(a);
    list.appendChild(li);
  }

  return list;
}
