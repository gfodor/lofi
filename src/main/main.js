import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
import * as path from "path";
import { format } from "url";
import cst from "c-struct";
import fs from "fs";
import ioctl from "ioctl";
const DEVICE_NAME = "/dev/video4";
const V4L2_BUF_TYPE_VIDEO_OUTPUT = 2;
const V4L2_PIX_FMT_BGRA444 = 0x32314147; // 'GA12'

app.disableHardwareAcceleration();

let win = null;

cst.register(
  "v4l2_fmt_pix",
  new cst.Schema({
    type: cst.type.uint32,
    width: cst.type.uint32,
    height: cst.type.uint32,
    pixelformat: cst.type.uint32,
    field: cst.type.uint32,
    bytesperline: cst.type.uint32,
    sizeimage: cst.type.uint32,
    colorspace: cst.type.uint32,
    priv: cst.type.uint32,
    flags: cst.type.uint32,
    ycbcr_or_hsv_enc: cst.type.uint32,
    quantization: cst.type.uint32,
    xfer_func: cst.type.uint32,
  })
);

async function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      offscreen: true,
    },
    show: false,
  });

  const isDev = is.development;

  if (isDev) {
    win.loadURL("http://localhost:9080");
  } else {
    win.loadURL(
      format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true,
      })
    );
  }

  let cam = -1;

  fs.open(DEVICE_NAME, "as+", 0o666, (err, fd) => {
    cam = fd;

    const pixfmt = cst.packSync("v4l2_fmt_pix", {
      type: V4L2_BUF_TYPE_VIDEO_OUTPUT,
      width: 1024,
      height: 768,
      pixelformat: V4L2_PIX_FMT_BGRA444,
    });
  });

  win.webContents.on("paint", (event, dirty, image) => {
    const buf = image.getBitmap();
    console.log(buf);
    fs.writeFileSync("ex.png", image.toPNG());
  });

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("devtools-opened", () => {
    win.focus();
  });

  win.on("ready-to-show", () => {
    win.show();
    win.focus();

    if (isDev) {
      win.webContents.openDevTools({ mode: "bottom" });
    }
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (!is.macos) {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
