import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Exercise the shipped script's event handlers without a browser dependency.
function harness() {
  class Node {
    children = [];
    style = {};
    dataset = {};
    value = "";
    scrollTop = 0;
    clientHeight = 640;
    textContent = "";
    append(...nodes) {
      this.children.push(...nodes);
    }
    replaceChildren(...nodes) {
      this.children = nodes;
    }
    setAttribute() {}
    focus() {}
    querySelector() {
      return undefined;
    }
  }
  const nodes = new Map();
  const get = (id) => {
    if (!nodes.has(id)) nodes.set(id, new Node());
    return nodes.get(id);
  };
  get("filter").value = "all";
  const events = {};
  const messages = [];
  vm.runInNewContext(readFileSync("webview/app.js", "utf8"), {
    acquireVsCodeApi: () => ({ postMessage: (m) => messages.push(m) }),
    document: {
      getElementById: get,
      createElement: () => new Node(),
      createDocumentFragment: () => new Node(),
      createTextNode: (text) => ({ textContent: text }),
    },
    window: {
      addEventListener: (name, handler) => {
        events[name] = handler;
      },
    },
  });
  return { get, events, messages, send: (data) => events.message({ data }) };
}
const snapshot = {
  context: "/context",
  dockerfile: "/context/Dockerfile",
  ignore: "/context/.dockerignore",
  entries: [{ path: "app.js", kind: "file", size: 10 }],
  excluded: [false],
  savedExcluded: [false],
  issues: [],
  draft: false,
};
test("error clears stale rows and selection; resize, scroll and keys remain safe before recovery", () => {
  const h = harness();
  const sendSnapshot = () =>
    h.send({ type: "snapshot", snapshot, totals: { count: 1, bytes: 10 } });
  sendSnapshot();
  h.get("tree").onkeydown({ key: "Enter", preventDefault() {} });
  assert(h.messages.some((m) => m.type === "explain"));
  h.send({ type: "error", message: "Context removed" });
  const count = h.messages.length;
  h.events.resize();
  h.get("tree").onscroll();
  for (const key of ["Enter", "ArrowDown", "ArrowLeft", "End"])
    h.get("tree").onkeydown({ key, preventDefault() {} });
  h.get("search").oninput();
  h.get("filter").onchange();
  assert.equal(h.messages.length, count);
  assert.equal(h.get("rows").children.length, 0);
  assert.equal(h.get("results").textContent, "0 shown");
  assert.equal(h.get("tree").hidden, true);
  sendSnapshot();
  assert.equal(h.get("tree").hidden, false);
  assert.equal(h.get("results").textContent, "1 shown");
  assert.equal(
    h.messages.length,
    count,
    "Recovery must not reuse the old selection",
  );
  h.get("tree").onkeydown({ key: "Enter", preventDefault() {} });
  assert.equal(h.messages.at(-1).type, "explain");
});
