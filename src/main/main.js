import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
import * as path from "path";
import { format } from "url";
import ref from "ref-napi";
import cst from "ref-struct-di";
import fs from "fs";
import ioctl from "ioctl";
import * as libyuv from "libyuv";
import addonModule from "../../build/Release/addon.node";
//const addonModule = {};

const DEVICE_NAME = "/dev/video4";
const V4L2_BUF_TYPE_VIDEO_OUTPUT = 2;
const V4L2_PIX_FMT_BGRA444 = 0x32314147;
const V4L2_PIX_FMT_YUV420 = 0x32315559;
const VIDIOC_S_FMT = 0xc0d05605;

app.disableHardwareAcceleration();

let win = null;
let addon = null;
let cameraFd = -1;
const frameTimings = [];

const PLATFORM = "mac";
const OFFSCREEN = true;
const WIDTH = 800;
const HEIGHT = 448;

if (addonModule.startServer) {
  addonModule.startServer();
}

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
    width: WIDTH,
    height: HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      offscreen: OFFSCREEN,
      show: !OFFSCREEN,
      enableBlinkFeatures: "SharedArrayBuffer",
      paintWhenInitiallyHidden: true,
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

  if (PLATFORM === "linux") {
    fs.open(DEVICE_NAME, "as+", 0o666, (err, fd) => {
      cameraFd = fd;

      const pixfmt = new v4l2_fmt_pix({
        type: V4L2_BUF_TYPE_VIDEO_OUTPUT,
        width: WIDTH,
        height: HEIGHT,
        pixelformat: V4L2_PIX_FMT_YUV420,
      });

      if (ioctl(cameraFd, VIDIOC_S_FMT, pixfmt.ref()) === -1) {
        // TODO error
      }
    });
  }

  // TODO pixel ratio of 1
  win.webContents.setFrameRate(30);

  win.webContents.on("paint", (event, dirty, image) => {
    // TODO this Uint8Array may not be needed
    const now = performance.now();

    const buf = new Uint8Array(image.getBitmap());
    const { width, height: height_ } = image.getSize();
    const height = Math.abs(height_);

    if (width !== WIDTH) {
      const inversePixelRatio = WIDTH / width;
      win.setSize(
        Math.floor(WIDTH * inversePixelRatio),
        Math.floor(HEIGHT * inversePixelRatio)
      );
    }

    const i420 = new Uint8Array(new Buffer(Math.floor(width * height * 1.5)));
    i420.fill(0, 0, Math.floor(width * height * 1.5));

    const half_width = Math.floor(width / 2);
    const half_height = Math.floor(height / 2);

    libyuv.ARGBToI420(
      buf,
      width * 4,
      i420,
      width,
      i420.subarray(width * height),
      half_width,
      i420.subarray(width * height + (width * height) / 4),
      half_width,
      width,
      height
    );

    const uyvy = new Uint8Array(new Buffer(Math.floor(width * height * 2)));
    uyvy.fill(0, 0, Math.floor(width * height * 2));

    libyuv.ARGBToUYVY(buf, width * 4, uyvy, width * 2, width, height);

    if (PLATFORM === "linux" && cameraFd !== -1) {
      fs.write(cameraFd, i420, () => {});
    }

    if (addonModule.sendFrame) {
      addonModule.sendFrame(
        width,
        height,
        BigInt((new Date().getTime() - 1621811197991993) * 1000000),
        30,
        1,
        uyvy
      );
    }
  });

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("devtools-opened", () => {
    win.focus();
  });

  win.on("ready-to-show", () => {
    if (OFFSCREEN) return;
    win.show();
    win.focus();
  });
}

app.on("ready", () => {
  createWindow();
});

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

app.on("quit", () => {
  if (addonModule.stopServer) {
    addonModule.stopServer();
  }

  if (cameraFd !== -1) {
    fs.close(cameraFd);
  }
});
