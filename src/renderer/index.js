import React from "react";
import { render } from "react-dom";

import { App } from "./App";

navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const levels = new Uint8Array(analyser.fftSize);
  const source = audioContext.createMediaStreamSource(media);
  source.connect(analyser);
  setInterval(() => {
    // take care with compatibility, e.g. safari doesn't support getFloatTimeDomainData
    analyser.getByteTimeDomainData(levels);
    let sum = 0;
    for (let i = 0; i < levels.length; i++) {
      const amplitude = (levels[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const currVolume = Math.sqrt(sum / levels.length);
    document.body.style = `background-color: rgba(${Math.floor(
      currVolume * 5 * 255
    )}, 50, 50, 1.0);`;
    console.log(currVolume);
  }, 50);
});

render(<App />, document.getElementById("root"));
