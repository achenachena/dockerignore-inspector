/* global acquireVsCodeApi, document, window */
const vscode = acquireVsCodeApi();
const $ = (id) => document.getElementById(id);
let snapshot;
let visible = [];
let selected = "";
let collapsed = new Set();
let busy = false;
let aggregates = new Map();
let changePage = 0;
const rowHeight = 32;
const post = (type, data = {}) => vscode.postMessage({ type, ...data });
const size = (n) =>
  n === null
    ? "Unknown"
    : n < 1024
      ? `${n} B`
      : n < 1048576
        ? `${(n / 1024).toFixed(1)} KB`
        : n < 1073741824
          ? `${(n / 1048576).toFixed(1)} MB`
          : `${(n / 1073741824).toFixed(2)} GB`;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
for (const id of [
  "context",
  "dockerfile",
  "edit",
  "refresh",
  "cancel",
  "example",
])
  $(id).onclick = () => post(id);
function unknown(i) {
  return (
    !!snapshot.error ||
    snapshot.entries[i].kind === "unknown" ||
    !!snapshot.entries[i].error
  );
}
function state(i) {
  return unknown(i)
    ? "Unknown"
    : snapshot.excluded[i]
      ? "Excluded"
      : "Included";
}
function changed(i) {
  return (
    snapshot.draft &&
    !snapshot.error &&
    snapshot.excluded[i] !== snapshot.savedExcluded[i]
  );
}
function aggregate() {
  aggregates = new Map();
  snapshot.entries.forEach((entry, i) => {
    if (entry.kind === "directory" || snapshot.excluded[i]) return;
    let parent = entry.path.split("/").slice(0, -1);
    while (parent.length) {
      const key = parent.join("/");
      aggregates.set(
        key,
        (aggregates.get(key) || 0) +
          (entry.kind === "file" ? entry.size || 0 : 0),
      );
      parent.pop();
    }
  });
}
function filter() {
  if (!snapshot) return;
  const query = $("search").value.toLowerCase();
  const mode = $("filter").value;
  visible = snapshot.entries
    .map((entry, i) => ({ entry, i }))
    .filter(({ entry, i }) => {
      if (query && !entry.path.toLowerCase().includes(query)) return false;
      if (mode === "included" && state(i) !== "Included") return false;
      if (mode === "excluded" && state(i) !== "Excluded") return false;
      if (mode === "changed" && !changed(i)) return false;
      if (!query && mode === "all") {
        let parts = entry.path.split("/");
        parts.pop();
        while (parts.length) {
          if (collapsed.has(parts.join("/"))) return false;
          parts.pop();
        }
      }
      return true;
    });
  $("results").textContent = `${visible.length.toLocaleString()} shown`;
  $("spacer").style.height = `${visible.length * rowHeight}px`;
  $("empty").hidden = visible.length > 0;
  $("tree").hidden = visible.length === 0;
  if (visible.length === 0)
    $("empty").textContent = snapshot.entries.length
      ? "No files match this filter."
      : "This context is empty.";
  rows();
}
function choose(entry) {
  selected = entry.path;
  rows();
  const i = snapshot.entries.indexOf(entry);
  const box = $("explanation");
  box.replaceChildren(
    element("strong", entry.path),
    element("p", `${state(i)} · ${entry.kind}`),
  );
  if (entry.kind === "directory")
    box.append(
      element(
        "p",
        "The directory status reflects its own rules. Descendants may be re-included independently. Its size sums included regular files beneath it.",
      ),
    );
  if (entry.kind === "symlink")
    box.append(
      element(
        "p",
        "Symbolic link. The target is not traversed or included in the byte total. COPY behavior for symlink targets is outside this preview.",
      ),
    );
  if (entry.error) box.append(element("p", entry.error));
  const absolute = snapshot.context + "/" + entry.path;
  if (absolute === snapshot.dockerfile || absolute === snapshot.ignore)
    box.append(
      element(
        "p",
        "Build control file. Docker can read this file for the build even when excluded from COPY. The displayed state describes ordinary context access.",
      ),
    );
  if (!snapshot.error && !busy) {
    box.append(element("p", "Tracing effective rule changes…", "pending"));
    post("explain", { path: entry.path });
  }
  if (entry.kind === "file") {
    const open = element("button", "Open file");
    open.onclick = () => post("open", { path: entry.path });
    box.append(open);
  }
}
function rows() {
  const start = Math.max(0, Math.floor($("tree").scrollTop / rowHeight) - 6);
  $("rows").style.transform = `translateY(${start * rowHeight}px)`;
  const fragment = document.createDocumentFragment();
  for (const { entry, i } of visible.slice(
    start,
    start + Math.ceil($("tree").clientHeight / rowHeight) + 12,
  )) {
    const row = element(
      "div",
      undefined,
      `row ${selected === entry.path ? "selected" : ""}`,
    );
    row.setAttribute("role", "treeitem");
    row.setAttribute("aria-selected", String(selected === entry.path));
    row.setAttribute("aria-level", String(entry.path.split("/").length));
    row.title = entry.path;
    row.dataset.path = entry.path;
    const directory = entry.kind === "directory";
    if (directory)
      row.setAttribute("aria-expanded", String(!collapsed.has(entry.path)));
    const name = element(
      "span",
      `${directory ? (collapsed.has(entry.path) ? "▸ " : "▾ ") : entry.kind === "symlink" ? "↗ " : "· "}${entry.path.split("/").at(-1)}`,
      "name",
    );
    name.style.paddingLeft = `${Math.min(8, entry.path.split("/").length - 1) * 12}px`;
    const bytes = snapshot.error
      ? "Unknown"
      : directory
        ? size(aggregates.get(entry.path) || 0)
        : size(entry.size);
    row.append(
      name,
      element(
        "span",
        `${changed(i) ? "Δ " : ""}${state(i)} · ${snapshot.partial && directory ? "≥ " : ""}${bytes}`,
        `state ${state(i).toLowerCase()}`,
      ),
    );
    row.onclick = () => {
      choose(entry);
      $("tree").focus();
    };
    row.ondblclick = () => {
      if (directory) {
        if (collapsed.has(entry.path)) collapsed.delete(entry.path);
        else collapsed.add(entry.path);
        filter();
      }
    };
    fragment.append(row);
  }
  $("rows").replaceChildren(fragment);
}
$("tree").onscroll = rows;
$("tree").onkeydown = (event) => {
  if (!visible.length) return;
  let index = visible.findIndex(({ entry }) => entry.path === selected);
  if (index < 0) index = 0;
  if (
    event.key === "ArrowDown" ||
    event.key === "ArrowUp" ||
    event.key === "Home" ||
    event.key === "End"
  ) {
    event.preventDefault();
    index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? visible.length - 1
          : Math.max(
              0,
              Math.min(
                visible.length - 1,
                index + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
    choose(visible[index].entry);
    $("tree").scrollTop = Math.max(
      0,
      index * rowHeight - $("tree").clientHeight / 2,
    );
    rows();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const entry = visible[index].entry;
    if (entry.kind === "directory") {
      if (event.key === "ArrowLeft") collapsed.add(entry.path);
      else collapsed.delete(entry.path);
      filter();
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    choose(visible[index].entry);
  }
};
$("search").oninput = () => {
  $("tree").scrollTop = 0;
  filter();
};
$("filter").onchange = () => {
  $("tree").scrollTop = 0;
  filter();
};
function changes() {
  const box = $("changes");
  box.replaceChildren();
  if (snapshot.error) {
    box.textContent = "Fix invalid rules before comparing file sets.";
    return;
  }
  if (!snapshot.draft) {
    box.textContent = "No unsaved changes. Edit rules to preview their effect.";
    return;
  }
  const changedEntries = snapshot.entries
    .map((entry, i) => ({ entry, i }))
    .filter(({ entry, i }) => entry.kind !== "directory" && changed(i));
  let added = 0,
    removed = 0,
    delta = 0;
  for (const { entry, i } of changedEntries) {
    if (snapshot.excluded[i]) {
      removed++;
      delta -= entry.kind === "file" ? entry.size || 0 : 0;
    } else {
      added++;
      delta += entry.kind === "file" ? entry.size || 0 : 0;
    }
  }
  box.append(
    element("strong", `+${added} included · −${removed} excluded`),
    element(
      "p",
      `${snapshot.partial ? "Within scanned entries: " : ""}${delta < 0 ? "−" : "+"}${size(Math.abs(delta))} logical size. Symlink and unknown sizes are omitted.`,
    ),
  );
  if (!changedEntries.length)
    box.append(element("p", "The draft does not change the scanned file set."));
  const pageSize = 30;
  changePage = Math.min(
    changePage,
    Math.max(0, Math.ceil(changedEntries.length / pageSize) - 1),
  );
  for (const { entry, i } of changedEntries.slice(
    changePage * pageSize,
    (changePage + 1) * pageSize,
  )) {
    const button = element(
      "button",
      `${snapshot.excluded[i] ? "−" : "+"} ${entry.path}`,
      "change",
    );
    button.onclick = () => {
      $("search").value = entry.path;
      $("filter").value = "all";
      filter();
      choose(entry);
    };
    box.append(button);
  }
  if (changedEntries.length > pageSize) {
    const previous = element("button", "Previous");
    previous.disabled = changePage === 0;
    previous.onclick = () => {
      changePage--;
      changes();
    };
    const next = element("button", "Next");
    next.disabled = (changePage + 1) * pageSize >= changedEntries.length;
    next.onclick = () => {
      changePage++;
      changes();
    };
    box.append(
      element(
        "p",
        `Page ${changePage + 1} of ${Math.ceil(changedEntries.length / pageSize)}`,
      ),
      previous,
      next,
    );
  }
}
window.addEventListener("message", ({ data }) => {
  if (data.type === "status") {
    busy = data.busy;
    $("status").textContent = data.message;
    $("cancel").disabled = !busy;
    $("tree").setAttribute("aria-busy", String(busy));
    return;
  }
  if (data.type === "error") {
    busy = false;
    snapshot = undefined;
    $("issues").textContent = data.message;
    $("status").textContent =
      "Unable to inspect this context. Check the paths and refresh.";
    $("rows").replaceChildren();
    $("spacer").style.height = "0px";
    $("count").textContent = "—";
    $("size").textContent = "—";
    $("mode").textContent = "Error";
    $("explanation").textContent = "No current results.";
    $("changes").textContent = "No current comparison.";
    $("cancel").disabled = true;
    return;
  }
  if (data.type === "snapshot") {
    const oldContext = snapshot?.context;
    snapshot = data.snapshot;
    busy = false;
    if (oldContext !== snapshot.context) {
      collapsed = new Set();
      selected = "";
    }
    const paths = $("paths");
    paths.replaceChildren();
    for (const [label, value] of [
      ["Context", snapshot.context],
      ["Dockerfile", snapshot.dockerfile],
      ["Active rules", snapshot.ignore || "No ignore file found"],
    ]) {
      const line = element("div");
      line.append(element("b", label), document.createTextNode(value));
      paths.append(line);
    }
    if (snapshot.specific)
      paths.append(
        element(
          "div",
          "Dockerfile-specific rules are active; root .dockerignore is not used.",
        ),
      );
    $("count").textContent = snapshot.error
      ? "—"
      : `${snapshot.partial ? "≥ " : ""}${data.totals.count.toLocaleString()}`;
    $("size").textContent = snapshot.error
      ? "—"
      : `${snapshot.partial ? "≥ " : ""}${size(data.totals.bytes)}`;
    $("mode").textContent = snapshot.draft ? "Unsaved draft" : "Saved rules";
    $("issues").textContent = [
      snapshot.error,
      ...snapshot.issues,
      data.totals.unknown
        ? `${data.totals.unknown} included entries have unknown size.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    $("edit").disabled = !snapshot.ignore;
    aggregate();
    filter();
    changes();
    $("explanation").textContent = snapshot.draft
      ? "Draft preview — changes are not saved. Select a file to trace its rules."
      : "Select a file to inspect its effective rules.";
    const currentEntry = snapshot.entries.find(
      (entry) => entry.path === selected,
    );
    if (currentEntry) choose(currentEntry);
    return;
  }
  if (data.type === "explanation" && snapshot && data.path === selected) {
    const box = $("explanation");
    box.querySelector(".pending")?.remove();
    if (data.error) {
      box.append(element("p", data.error));
      return;
    }
    if (!data.reasons?.length)
      box.append(
        element("p", "Included by default. No rule changes this file’s state."),
      );
    else {
      box.append(element("p", "Effective state changes, in rule order:"));
      for (const reason of data.reasons) {
        const button = element(
          "button",
          `${reason.excluded ? "Excluded" : "Re-included"} by line ${reason.line}: ${reason.rule}`,
          "rule",
        );
        button.onclick = () => post("rule", { line: reason.line });
        box.append(button);
      }
    }
  }
});
window.addEventListener("resize", rows);
post("ready");
