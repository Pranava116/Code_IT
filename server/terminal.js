const { WebSocketServer } = require("ws");
const pty = require("node-pty");
const os = require("os");
const url = require("url");
const fs = require("fs");
const path = require("path");
const Y = require("yjs");
const { getProjectFiles, prisma } = require("./utils");

const PORT = 1235;
const wss = new WebSocketServer({ port: PORT });

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

wss.on("connection", async (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const projectId = parsedUrl.query.projectId;

  if (!projectId) {
    ws.send("Error: No projectId provided\r\n");
    ws.close();
    return;
  }

  console.log(`Terminal connection established for project ${projectId}`);

  // Create workspace directory
  const workspaceDir = path.join(process.cwd(), ".workspaces", projectId);
  fs.mkdirSync(workspaceDir, { recursive: true });

  // Create a .bashrc in the workspace to set the prompt
  fs.writeFileSync(
    path.join(workspaceDir, ".bashrc"),
    "export PS1='\\[\\e[1;34m\\]\\w\\[\\e[0m\\] $ '\n"
  );

  // Sync files from DB
  try {
    const files = await getProjectFiles(projectId);

    for (const file of files) {
      if (file.node.type === "folder") {
        fs.mkdirSync(path.join(workspaceDir, file.fullPath), { recursive: true });
      } else {
        // It's a file
        fs.mkdirSync(path.dirname(path.join(workspaceDir, file.fullPath)), { recursive: true });

        const latestVersion = await prisma.documentVersion.findFirst({
          where: { nodeId: file.node.id },
          orderBy: { createdAt: "desc" },
        });

        if (latestVersion && latestVersion.content) {
          const buffer = Buffer.from(latestVersion.content, "base64");
          const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, uint8Array);
          const text = ydoc.getText("monaco").toString();

          fs.writeFileSync(path.join(workspaceDir, file.fullPath), text);
        } else {
          // Empty file
          fs.writeFileSync(path.join(workspaceDir, file.fullPath), "");
        }
      }
    }
  } catch (error) {
    console.error("Error syncing files for terminal:", error);
    ws.send(`Error syncing files: ${error.message}\r\n`);
  }

  let command = shell;
  let args = [];
  let cwd = workspaceDir;
  let env = { ...process.env };

  if (os.platform() !== "win32") {
    // Bubblewrap isolation for Linux
    command = "bwrap";
    args = [
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
      "--share-net"
    ];

    // Bind NVM directory if it exists to allow node/npm to work
    const nvmDir = path.join(os.homedir(), ".nvm");
    if (fs.existsSync(nvmDir)) {
      args.push("--ro-bind", nvmDir, nvmDir);
    }

    args.push("bash", "--rcfile", "/workspace/.bashrc");
    env.HOME = "/workspace";
    env.PWD = "/workspace";
  }

  const ptyProcess = pty.spawn(command, args, {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: workspaceDir,
    env: env,
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "input") {
        ptyProcess.write(data.data);
      } else if (data.type === "resize") {
        ptyProcess.resize(data.cols, data.rows);
      }
    } catch (e) {
      ptyProcess.write(msg.toString());
    }
  });

  ws.on("close", () => {
    console.log(`Terminal connection closed for project ${projectId}`);
    ptyProcess.kill();
  });
});

console.log(`Terminal WebSocket Server listening on ws://127.0.0.1:${PORT}`);
