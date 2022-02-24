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

const DEVICE_NAME = "/dev/video4";
const V4L2_BUF_TYPE_VIDEO_OUTPUT = 2;
const V4L2_PIX_FMT_BGRA444 = 0x32314147;
const V4L2_PIX_FMT_YUV420 = 0x32315559;
const VIDIOC_S_FMT = 0xc0d05605;

console.log(JSON.stringify(process.versions, null, 2));
app.disableHardwareAcceleration();

let win = null;
let addon = null;
let cameraFd = -1;
const frameTimings = [];

const PLATFORM = "mac";

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
    width: 1280 / 2.0,
    height: 720 / 2.0,
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

  if (PLATFORM === "linux") {
    fs.open(DEVICE_NAME, "as+", 0o666, (err, fd) => {
      cameraFd = fd;

      const pixfmt = new v4l2_fmt_pix({
        type: V4L2_BUF_TYPE_VIDEO_OUTPUT,
        width: 1280,
        height: 720,
        pixelformat: V4L2_PIX_FMT_YUV420,
      });

      if (ioctl(cameraFd, VIDIOC_S_FMT, pixfmt.ref()) === -1) {
        // TODO error
      }
    });
  }

  // TODO pixel ratio of 1
  win.webContents.setFrameRate(60);

  win.webContents.on("paint", (event, dirty, image) => {
    // TODO this Uint8Array may not be needed
    const now = performance.now();
    frameTimings.push(now);

    if (frameTimings.length > 180) {
      frameTimings.shift();
    }

    const buf = new Uint8Array(image.getBitmap());
    const { width, height: height_ } = image.getSize();
    const height = Math.abs(height_);

    if (PLATFORM === "linux" && cameraFd !== -1) {
      const i420 = new Uint8Array(new Buffer(Math.floor(width * height * 1.5)));
      i420.fill(0, 0, Math.floor(width * height * 1.5));

      console.log(width, height);
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
      fs.write(cameraFd, i420, () => {});
    }

    if (frameTimings.length > 30) {
      const fpsDenominator = Math.floor(
        frameTimings[frameTimings.length - 1] - frameTimings[0]
      );
      const fpsNumerator = frameTimings.length;
      const fps = fpsNumerator / fpsDenominator;

      const uyvy = new Uint8Array(new Buffer(Math.floor(width * height * 2)));
      uyvy.fill(0, 0, Math.floor(width * height * 2));

      libyuv.ARGBToUYVY(buf, width * 4, uyvy, width * 2, width, height);

      if (addonModule.sendFrame) {
        addonModule.sendFrame(
          width,
          height,
          BigInt(new Date().getTime()),
          fpsNumerator,
          fpsDenominator,
          uyvy
        );
      }
    }
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
      //win.webContents.openDevTools({ mode: "bottom" });
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

app.on("quit", () => {
  if (addonModule.stopServer) {
    addonModule.stopServer();
  }

  if (cameraFd !== -1) {
    fs.close(cameraFd);
  }
});
