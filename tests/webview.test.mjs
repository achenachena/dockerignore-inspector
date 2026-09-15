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

function populated() {
  const h = harness();
  const payload = {
    type: "snapshot",
    snapshot: {
      ...snapshot,
      entries: ["a.js", "b.js", "c.js"].map((path) => ({
        path,
        kind: "file",
        size: 10,
      })),
      excluded: [false, false, false],
      savedExcluded: [false, false, false],
    },
    totals: { count: 3, bytes: 30 },
  };
  h.send(payload);
  return {
    ...h,
    payload,
    key: (key) => h.get("tree").onkeydown({ key, preventDefault() {} }),
  };
}
function respond(h, request, rule) {
  h.send({
    type: "explanation",
    path: request.path,
    requestId: request.requestId,
    reasons: [{ line: 1, rule, excluded: true }],
  });
}
function rules(h) {
  return h
    .get("explanation")
    .children.filter((node) => node.className === "rule")
    .map((node) => node.textContent);
}
test("first Down selects the first row and subsequent arrows move normally", () => {
  const h = populated();
  for (const [key, expected] of [
    ["ArrowDown", "a.js"],
    ["ArrowDown", "b.js"],
    ["ArrowUp", "a.js"],
    ["ArrowUp", "a.js"],
    ["End", "c.js"],
    ["Home", "a.js"],
  ]) {
    h.key(key);
    assert.equal(h.messages.at(-1).path, expected);
  }
});
test("repeated selection accepts only the newest explanation once", () => {
  const h = populated();
  h.key("Enter");
  const first = h.messages.at(-1);
  h.key("Enter");
  const second = h.messages.at(-1);
  assert(Number.isSafeInteger(second.requestId));
  assert.notEqual(first.requestId, second.requestId);
  respond(h, second, "new");
  respond(h, first, "old");
  respond(h, second, "duplicate");
  assert.deepEqual(rules(h), ["Excluded by line 1: new"]);
});
test("A to B to A ignores out-of-order responses and invalidates on new snapshots", () => {
  const h = populated();
  h.key("Home");
  const a1 = h.messages.at(-1);
  h.key("ArrowDown");
  const b = h.messages.at(-1);
  h.key("Home");
  const a2 = h.messages.at(-1);
  respond(h, b, "wrong-file");
  respond(h, a1, "old-a");
  assert.deepEqual(rules(h), []);
  respond(h, a2, "current-a");
  assert.deepEqual(rules(h), ["Excluded by line 1: current-a"]);
  h.send(h.payload);
  const refreshed = h.messages.at(-1);
  respond(h, a2, "previous-snapshot");
  assert.deepEqual(rules(h), []);
  respond(h, refreshed, "refreshed");
  assert.deepEqual(rules(h), ["Excluded by line 1: refreshed"]);
});
test("pending explanations are ignored after recalculation, cancellation and errors", () => {
  const h = populated();
  for (const invalidate of [
    () => h.send({ type: "status", busy: true, message: "Updating" }),
    () => h.get("cancel").onclick(),
    () => h.send({ type: "error", message: "Unavailable" }),
  ]) {
    h.send(h.payload);
    h.key("Enter");
    const request = h.messages.at(-1);
    invalidate();
    respond(h, request, "stale");
    assert.deepEqual(rules(h), []);
  }
});
