// Test-only guard: core tests must work when network entry points are unavailable.
const blocked = () => {
  throw new Error("Network is unavailable in this test");
};
for (const name of ["node:http", "node:https"]) {
  const transport = require(name);
  transport.request = blocked;
  transport.get = blocked;
}
const net = require("node:net");
net.connect = blocked;
net.createConnection = blocked;
globalThis.fetch = blocked;
