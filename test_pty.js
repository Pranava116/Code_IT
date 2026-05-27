const pty = require("node-pty");
const fs = require("fs");
const path = require("path");

const workspaceDir = "/tmp/test_workspace_pty";
fs.mkdirSync(workspaceDir, { recursive: true });
fs.writeFileSync(path.join(workspaceDir, ".bashrc"), "export PS1='\\[\\e[1;34m\\]\\w\\[\\e[0m\\] $ '\n");

const args = [
  "--ro-bind", "/usr", "/usr",
  "--symlink", "usr/bin", "/bin",
  "--symlink", "usr/lib", "/lib",
  "--symlink", "usr/lib64", "/lib64",
  "--ro-bind", "/etc", "/etc",
  "--dev", "/dev",
  "--proc", "/proc",
  "--bind", workspaceDir, "/workspace",
  "--chdir", "/workspace",
  "--unshare-all",
  "--share-net",
  "bash"
];

const env = { HOME: "/workspace", PWD: "/workspace" };

const ptyProcess = pty.spawn("bwrap", args, {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: workspaceDir,
  env: env,
});

ptyProcess.onData((data) => {
  console.log("PTY OUTPUT:", JSON.stringify(data));
});

setTimeout(() => {
  ptyProcess.write("pwd\r");
}, 1000);

setTimeout(() => process.exit(0), 2000);
