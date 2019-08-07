import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
//import Tone from 'tone';

/*
Create elements in the scene and animate them with more than constant, universally applied functions.

Two ways this could be accomplished:
- The properties of the elements are updated based on their relation to other elements in the scene.
eg. gravitation, dependent on relative position.
- The properties of the objects are updated based on a given sequence over time.
*/

let audioContext;
let mediaStreamSource = null;
let meter = null;

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
renderer.autoClearColor = false;
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

camera.position.z = 10;

let sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
let pointsMaterial = new THREE.PointsMaterial({ color: 0x000000, size: 0.1 });
let spherePoints = new THREE.Points(sphereGeometry, pointsMaterial);
scene.add(spherePoints);

let h = 0.0;

const animate = () => {
  requestAnimationFrame(animate);
  //spherePoints.rotation.y += 0.005;
  //spherePoints.rotation.x += 0.005;
  h = (h + 0.005) % 1.0;
  pointsMaterial.color.setHSL(h, 1.0, 0.5);
  renderer.render(scene, camera);
};

renderer.clearColor();
animate();

class CircularBuffer {
  constructor(len, val) {
    this.buffer = Array(len).fill(val);
    this.index = 0;
  }

  push(value) {
    this.buffer[this.index] = value;
    this.index++;
    if (this.index >= this.buffer.length) {
      this.index = 0;
    }
  }

  mean() {
    const sum = this.buffer.reduce((a, b) => a + b, 0);
    return sum / this.buffer.length;
  }
}

const keyDown = e => {
  if (!audioContext) beginDetect();
  else {
    console.log(camera.position);
  }
};

window.addEventListener('keydown', keyDown);

function beginDetect() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaStreamSource = audioContext.createMediaStreamSource(stream);
      meter = createAudioMeter(audioContext);
      mediaStreamSource.connect(meter);
    });
  }
}

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
  const processor = audioContext.createScriptProcessor(512);
  processor.onaudioprocess = volumeAudioProcess;
  processor.clipping = false;
  processor.lastClip = 0;
  processor.volume = 0;
  processor.clipLevel = clipLevel || 0.98;
  processor.averaging = averaging || 0.95;
  processor.clipLag = clipLag || 750;

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination);

  processor.checkClipping = function() {
    if (!this.clipping) {
      return false;
    }
    if (this.lastClip + this.clipLag < window.performance.now()) {
      this.clipping = false;
    }
    return this.clipping;
  };

  processor.shutdown = function() {
    this.disconnect();
    this.onaudioprocess = null;
  };
  return processor;
}

function volumeAudioProcess(event) {
  const buf = event.inputBuffer.getChannelData(0);
  const bufLength = buf.length;
  let sum = 0;
  let x;

  for (var i = 0; i < bufLength; i++) {
    x = buf[i];
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true;
      this.lastClip = window.performance.now();
    }
    sum += x * x;
  }
  const rms = Math.sqrt(sum / bufLength);

  this.volume = Math.max(rms, this.volume * this.averaging);

  // This can all be transferred to webassembly.
  // I need to come up with a better system for determining and working within hi and lo rms values.
  // What is this.averaging, and can I use it to set hi and lo?

  let val = this.volume / 0.5;
  //val += 0.1;
  if (val > 0.85) {
    val = 0.85;
  }

  //h = val;
}
