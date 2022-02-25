import React from "react";
import { render } from "react-dom";

import { App } from "./App";
import rnnWasm from "./rnnoise-vad-wasm.js";
import vadNoiseWorkletSrc from "./vad-noise-worklet.js";
import audioForwardWorkletSrc from "./audio-forward-worklet.js";
import createLipSyncWorker from "./lip-sync.worker.js";

const lipSyncFeatureBuffer = new SharedArrayBuffer(
  28 * Float32Array.BYTES_PER_ELEMENT
);
const lipSyncResultBuffer = new SharedArrayBuffer(1);
const lipSyncAudioFrameBuffer1 = new SharedArrayBuffer(2048 * 4);
const lipSyncAudioFrameBuffer2 = new SharedArrayBuffer(2048 * 4);
const lipSyncAudioOffsetBuffer = new SharedArrayBuffer(1);
const lipSyncVadBuffer = new SharedArrayBuffer(4);
const lipSyncFeatureData = new Float32Array(lipSyncFeatureBuffer.featureBuffer);
const lipSyncResultData = new Uint8Array(lipSyncResultBuffer);
const lipSyncVadData = new Float32Array(lipSyncVadBuffer);

const EYE_DECAL_NEUTRAL = 0;
const EYE_DECAL_UP = 1;
const EYE_DECAL_DOWN = 2;
const EYE_DECAL_LEFT = 3;
const EYE_DECAL_RIGHT = 4;
const EYE_DECAL_BLINK1 = 5;
const EYE_DECAL_BLINK2 = 6;
const EYE_DECAL_BLINK3 = 7;
const EYE_SHIFT_DECALS = [
  EYE_DECAL_LEFT,
  EYE_DECAL_RIGHT,
  EYE_DECAL_UP,
  EYE_DECAL_DOWN,
];
const BLINK_TRIGGER_PROBABILITY = 0.0025;
const SHIFT_TRIGGER_PROBABILITY = 0.005;
const BLINK_FRAME_DURATION_MS = 25.0;
const EYE_SHIFT_DURATION_MS = 500.0;

let scheduledEyeDecal = { t: 0.0, decal: 0, state: 0 };

document.body.style = `zoom: ${(1 / window.devicePixelRatio) * 100}%`;

navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(media);

  const lipSyncGain = audioContext.createGain();
  lipSyncGain.gain.setValueAtTime(3.0, audioContext.currentTime);

  const lipSyncHardLimit = audioContext.createDynamicsCompressor();
  lipSyncHardLimit.threshold.value = -12;
  lipSyncHardLimit.knee.value = 0.0;
  lipSyncHardLimit.ratio.value = 20.0;
  lipSyncHardLimit.attack.value = 0.005;
  lipSyncHardLimit.release.value = 0.05;

  const lipSyncVadDestination = audioContext.createMediaStreamDestination();
  const lipSyncForwardingDestination =
    audioContext.createMediaStreamDestination();

  audioContext.audioWorklet
    .addModule(
      URL.createObjectURL(
        new Blob([audioForwardWorkletSrc], { type: "application/javascript" })
      )
    )
    .then(() => {
      audioContext.audioWorklet
        .addModule(
          URL.createObjectURL(
            new Blob([vadNoiseWorkletSrc], { type: "application/javascript" })
          )
        )
        .then(() => {
          const lipSyncForwardingNode = new AudioWorkletNode(
            audioContext,
            "audio-forwarder",
            {
              processorOptions: {
                audioFrameBuffer1: lipSyncAudioFrameBuffer1,
                audioFrameBuffer2: lipSyncAudioFrameBuffer2,
                audioOffsetBuffer: lipSyncAudioOffsetBuffer,
              },
            }
          );

          const lipSyncVadProcessor = new AudioWorkletNode(
            audioContext,
            "vad",
            {
              processorOptions: {
                vadBuffer: lipSyncVadBuffer,
                rnnWasm,
                enabled: true,
              },
            }
          );

          const lipSyncWorker = createLipSyncWorker();

          lipSyncWorker.postMessage(lipSyncFeatureBuffer);
          lipSyncWorker.postMessage(lipSyncResultBuffer);
          lipSyncWorker.postMessage(lipSyncAudioFrameBuffer1);
          lipSyncWorker.postMessage(lipSyncAudioFrameBuffer2);
          lipSyncWorker.postMessage(lipSyncVadBuffer);
          lipSyncWorker.postMessage(lipSyncAudioOffsetBuffer);

          source.connect(lipSyncGain);
          lipSyncForwardingNode.connect(lipSyncForwardingDestination);
          lipSyncHardLimit.connect(lipSyncVadProcessor);
          lipSyncGain.connect(lipSyncHardLimit);
          lipSyncHardLimit.connect(lipSyncForwardingNode);
          lipSyncVadProcessor.connect(lipSyncVadDestination);
        });
    });
});

let avatarSwatch = null;
let lastViseme = 0;

const func = () => {
  if (!avatarSwatch) {
    avatarSwatch = document.querySelector(".avatar-swatch");
    if (!avatarSwatch) return;
    avatarSwatch.setAttribute("data-eyes", 0);
    avatarSwatch.setAttribute("data-mouth", 0);
  }

  if (lipSyncResultData[0] !== lastViseme) {
    lastViseme = lipSyncResultData[0];
    avatarSwatch.setAttribute("data-mouth", lastViseme);
  }

  const hasScheduledDecal = scheduledEyeDecal.t > 0.0;
  const t = performance.now();

  if (!hasScheduledDecal) {
    const r = Math.random();

    // First see if we will potentially schedule a blink or a shift.
    if (r > 0.5 && r - 0.5 <= BLINK_TRIGGER_PROBABILITY) {
      scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
      scheduledEyeDecal.decal = EYE_DECAL_BLINK1;
    } else if (r < 0.5 && r <= SHIFT_TRIGGER_PROBABILITY) {
      scheduledEyeDecal.t = t + EYE_SHIFT_DURATION_MS;
      scheduledEyeDecal.decal =
        EYE_SHIFT_DECALS[Math.floor(Math.random() * EYE_SHIFT_DECALS.length)];
    }
  }

  const hasEyeDecalChange = hasScheduledDecal && scheduledEyeDecal.t < t;

  if (hasEyeDecalChange) {
    const { decal } = scheduledEyeDecal;

    avatarSwatch.setAttribute("data-eyes", decal);

    // Perform decal state machine for blink/shift
    switch (decal) {
      case EYE_DECAL_BLINK1:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal =
          scheduledEyeDecal.state === 0 ? EYE_DECAL_BLINK2 : EYE_DECAL_NEUTRAL;
        break;
      case EYE_DECAL_BLINK2:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal =
          scheduledEyeDecal.state === 0 ? EYE_DECAL_BLINK3 : EYE_DECAL_BLINK1;
        break;
      case EYE_DECAL_BLINK3:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal = EYE_DECAL_BLINK2;
        scheduledEyeDecal.state = 1; // Used to know if closing or opening eyes in blink.
        break;
      case EYE_DECAL_UP:
      case EYE_DECAL_DOWN:
      case EYE_DECAL_LEFT:
      case EYE_DECAL_RIGHT:
        scheduledEyeDecal.t = t + EYE_SHIFT_DURATION_MS;
        scheduledEyeDecal.decal = EYE_DECAL_NEUTRAL;
        break;
      case EYE_DECAL_NEUTRAL:
        // Eye now neutral, deschedule decals.
        scheduledEyeDecal.t = 0.0;
        scheduledEyeDecal.state = 0;
    }
  }

  requestAnimationFrame(func);
};

requestAnimationFrame(func);

render(<App />, document.getElementById("root"));
