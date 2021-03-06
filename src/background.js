"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  systemPreferences
} from "electron";

import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

const isDevelopment = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

// ------  EXPRESS ------
let express = require("express");
const cors = require("cors");

const { routes } = require("../server/src/routes");

let appServer = express();
appServer.use(cors());
appServer.use(express.json());
appServer.use(
  express.urlencoded({
    extended: true
  })
);

// app routes
routes(appServer);

let server = appServer.listen(3020, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("App Listening at http://%s:%s", host, port);
});
// ------  EXPRESS ------

// Menu.setApplicationMenu(null)
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);
let createWindow = async function () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1150,
    height: 680,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    title: "Coffe Sync",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  });
  // win.setMenu(null);
  // win.setAutoHideMenuBar(true);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  ipcMain.on("resizeWindow", () => {
    const doubleClickAction = systemPreferences.getUserDefault(
      "AppleActionOnDoubleClick",
      "string"
    );

    if (doubleClickAction === "Minimize") {
      win.minimize();
    } else if (doubleClickAction === "Maximize") {
      if (!win.isMaximized()) {
        win.maximize();
      } else {
        win.unmaximize();
      }
    }
  });
};

// setInterval(() => {
//   win3.webContents.send("download-status", "33333");
// }, 3000);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
