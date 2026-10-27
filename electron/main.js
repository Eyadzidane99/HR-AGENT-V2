const { app, shell } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const host = "127.0.0.1";
let serverProcess;

function waitForServer(url, attempts = 60) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (attempts-- <= 0) {
          reject(new Error("The local HR Agent server did not start."));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

async function start() {
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverPath = path.join(standaloneDir, "server.js");

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: host,
      PORT: String(port),
      NODE_ENV: "production"
    },
    windowsHide: true,
    stdio: "ignore"
  });

  serverProcess.on("error", (error) => {
    console.error("Unable to start the local server:", error);
  });

  await waitForServer(`http://${host}:${port}`);
  await shell.openExternal(`http://${host}:${port}`);
}

app.whenReady().then(start).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});
