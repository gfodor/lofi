import React from "react";
import { render } from "react-dom";

import { App } from "./App";
import rnnWasm from "./rnnoise-vad-wasm.js";
import vadNoiseWorkletSrc from "./vad-noise-worklet.js";
import audioForwardWorkletSrc from "./audio-forward-worklet.js";
import createLipSyncWorker from "./lip-sync.worker.js";

navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(media);

  const lipSyncFeatureBuffer = new SharedArrayBuffer(
    28 * Float32Array.BYTES_PER_ELEMENT
  );
  const lipSyncResultBuffer = new SharedArrayBuffer(1);
  const lipSyncAudioFrameBuffer1 = new SharedArrayBuffer(2048 * 4);
  const lipSyncAudioFrameBuffer2 = new SharedArrayBuffer(2048 * 4);
  const lipSyncAudioOffsetBuffer = new SharedArrayBuffer(1);
  const lipSyncVadBuffer = new SharedArrayBuffer(4);
  const lipSyncFeatureData = new Float32Array(
    lipSyncFeatureBuffer.featureBuffer
  );
  const lipSyncResultData = new Uint8Array(lipSyncResultBuffer);
  const lipSyncVadData = new Float32Array(lipSyncVadBuffer);

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

          setInterval(() => {
            console.log(lipSyncResultData[0]);
          }, 15);
        });
    });
});

render(<App />, document.getElementById("root"));
