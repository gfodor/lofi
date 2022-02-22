import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
import * as path from "path";
import { format } from "url";
import ref from "ref-napi";
import cst from "ref-struct-di";
import fs from "fs";
import ioctl from "ioctl";
const DEVICE_NAME = "/dev/video4";
const V4L2_BUF_TYPE_VIDEO_OUTPUT = 2;
const V4L2_PIX_FMT_BGRA444 = 0x32314147;
const VIDIOC_S_FMT = 0xc0d05605;

app.disableHardwareAcceleration();

let win = null;
let cam_fd = -1;

const Struct = cst(ref);

const v4l2_fmt_pix = Struct({
  type: ref.types.uint32,
  foo: ref.types.uint32, //?? alignment
  width: ref.types.uint32,
  height: ref.types.uint32,
  pixelformat: ref.types.uint32,
  field: ref.types.uint32,
  bytesperline: ref.types.uint32,
  sizeimage: ref.types.uint32,
  colorspace: ref.types.uint32,
  priv: ref.types.uint32,
  flags: ref.types.uint32,
  ycbcr_or_hsv_enc: ref.types.uint32,
  quantization: ref.types.uint32,
  xfer_func: ref.types.uint32,
});

async function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
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

  fs.open(DEVICE_NAME, "as+", 0o666, (err, fd) => {
    cam_fd = fd;

    const pixfmt = new v4l2_fmt_pix({
      type: V4L2_BUF_TYPE_VIDEO_OUTPUT,
      width: 1920,
      height: 1080,
      pixelformat: V4L2_PIX_FMT_BGRA444,
    });

    const ret = ioctl(cam_fd, VIDIOC_S_FMT, pixfmt.ref());
    console.log(ret);
  });

  win.webContents.setFrameRate(60);
  win.webContents.on("paint", (event, dirty, image) => {
    const buf = image.getBitmap();
    fs.write(cam_fd, buf, () => {});
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

  if (cam_fd !== -1) {
    fs.close(cam_fd);
  }
});

app.on("activate", () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
