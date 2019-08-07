import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PixelShader } from 'three/examples/jsm/shaders/PixelShader.js';

import Tone from 'tone';

let renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  -1000,
  1000
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const pixelPass = new ShaderPass(PixelShader);
pixelPass.uniforms['resolution'].value = new THREE.Vector2(
  window.innerWidth,
  window.innerHeight
);
pixelPass.uniforms['resolution'].value.multiplyScalar(window.devicePixelRatio);
composer.addPass(pixelPass);
window.addEventListener('resize', resize);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  pixelPass.uniforms['resolution'].value
    .set(window.innerWidth, window.innerHeight)
    .multiplyScalar(window.devicePixelRatio);
}

camera.position.z = 10;

let sphereGeometry = new THREE.SphereBufferGeometry(1, 32, 32);

const sideLength = 20; // The feeling of disintegration, dematerialization.
const space = sideLength / 7;
const middleSpace = 0.75;
let materials = [];

const blue = new THREE.Color(0x4444ee);
const violet = new THREE.Color(0x3f00ff);
const gold = new THREE.Color(0x8877e2);

for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    for (let k = 0; k < 4; k++) {
      let material = new THREE.MeshBasicMaterial({
        color: blue,
        transparent: true,
        opacity: 0.5
      });
      materials.push(material);
      addSphere(
        material,
        -(i + middleSpace) * space,
        -(j + middleSpace) * space,
        -(k + middleSpace) * space
      );
      addSphere(
        material,
        -(i + middleSpace) * space,
        (j + middleSpace) * space,
        -(k + middleSpace) * space
      );
      addSphere(
        material,
        (i + middleSpace) * space,
        -(j + middleSpace) * space,
        -(k + middleSpace) * space
      );
      addSphere(
        material,
        (i + middleSpace) * space,
        (j + middleSpace) * space,
        -(k + middleSpace) * space
      );
      addSphere(
        material,
        -(i + middleSpace) * space,
        -(j + middleSpace) * space,
        (k + middleSpace) * space
      );
      addSphere(
        material,
        -(i + middleSpace) * space,
        (j + middleSpace) * space,
        (k + middleSpace) * space
      );
      addSphere(
        material,
        (i + middleSpace) * space,
        -(j + middleSpace) * space,
        (k + middleSpace) * space
      );
      addSphere(
        material,
        (i + middleSpace) * space,
        (j + middleSpace) * space,
        (k + middleSpace) * space
      );
    }
  }
}

function addSphere(material, x, y, z) {
  let sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.set(x, y, z);
  scene.add(sphere);
}

class Counter {
  constructor(min, max, onReset = () => {}) {
    this.min = min;
    this.max = max;
    this.onReset = onReset;
    this.count = min;
  }
  tick() {
    this.count++;
    if (this.count > this.max) {
      this.count = this.min;
      this.onReset();
    }
  }
}

const animate = () => {
  requestAnimationFrame(animate);
  composer.render();
};
animate();

class Drunk {
  constructor(minVal, maxVal, minStep, maxStep) {
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.minStep = minStep;
    this.maxStep = maxStep;
    this.val = Math.floor(Math.random() * (1 + maxVal - minVal)) + minVal;
  }
  tick() {
    const stepWeight =
      Math.floor(Math.random() * (1 + this.maxStep - this.minStep)) +
      this.minStep;
    const sign = Math.random() > 0.5 ? 1 : -1;
    const step = sign * stepWeight;
    let newVal = this.val + step;
    if (newVal > this.maxVal || newVal < this.minVal) newVal = this.val - step;
    this.val = newVal;
    return newVal;
  }
}

let gain = new Tone.Gain(0.02).toMaster();
let delayGain = new Tone.Gain(0.5).connect(gain);
var delay = new Tone.Delay(0.2).connect(delayGain);
let filter = new Tone.Filter(7000, 'peaking').connect(delay).connect(gain);
filter.Q.value = 0.1;
filter.gain.value = 15;
let osc1 = new Tone.Oscillator(0, 'sawtooth').connect(filter);
let osc2 = new Tone.Oscillator(0, 'sawtooth').connect(filter);
let noiseGain = new Tone.Gain(0.5).connect(filter);
let noise = new Tone.Noise('pink').connect(noiseGain);

const keyDown = e => {
  Tone.context.resume().then(() => {
    Tone.Transport.start();
    osc1.start();
    osc2.start();
    noise.start();
  });
};

window.addEventListener('keydown', keyDown);

const notes = [0, 3, 5, 8];
let sequence = Array(16).fill(0);
let patterns = Array(4).fill([]);

class NonRepeatingRandomizer {
  constructor(max) {
    this.max = max;
    this.lastValue = max;
  }
  next() {
    let rand = Math.floor(Math.random() * this.max);
    if (rand >= this.lastValue) rand++;
    this.lastValue = rand;
    return rand;
  }
}

const drunk = new Drunk(60, 80, 1, 5);
const noteRandomizer = new NonRepeatingRandomizer(3);
const patternRandomizer = new NonRepeatingRandomizer(materials.length - 1);

let lightColor = new THREE.Color();
lightColor.copy(violet);
lightColor.lerp(
  gold,
  (drunk.val - drunk.minVal) / (drunk.maxVal - drunk.minVal)
);

let lightOpacity =
  0.9 - (0.4 * (drunk.val - drunk.minVal)) / (drunk.maxVal - drunk.minVal);

const newSequenceCounterMax = () => Math.floor(Math.random() * 2) + 1;
const newLoopCounterMax = () => Math.floor(Math.random() * 3) + 4;

const sequenceCounter = new Counter(0, newSequenceCounterMax(), () => {
  sequenceCounter.max = newSequenceCounterMax();
  generateSequence();
});

const loopCounter = new Counter(0, newLoopCounterMax(), () => {
  loopCounter.max = newLoopCounterMax();
  sequenceCounter.tick();
  drunk.tick();
  lightColor.copy(violet);
  lightColor.lerp(
    gold,
    (drunk.val - drunk.minVal) / (drunk.maxVal - drunk.minVal)
  );
  lightOpacity =
    0.9 - (0.4 * (drunk.val - drunk.minVal)) / (drunk.maxVal - drunk.minVal);
});

const stepCounter = new Counter(0, 15, () => {
  loopCounter.tick();
});

function generateSequence() {
  for (let i = 0; i < sequence.length; i++) {
    sequence[i] = noteRandomizer.next();
  }
  if (sequence[0] === sequence[sequence.length - 1]) {
    const leftovers = [...Array(noteRandomizer.max).keys()].filter(
      x => !sequence.slice(0, 2).includes(x)
    );
    sequence[0] = leftovers[Math.floor(Math.random() * leftovers.length)];
  }
  console.log(sequence);
  for (let i = 0; i < patterns.length; i++) {
    patterns[i] = [];
    for (let j = 0; j < 2 * (i + 1); j++) {
      patterns[i].push(patternRandomizer.next());
    }
  }
}

generateSequence();

let stepLoop = new Tone.Loop(function(time) {
  const stepVal = sequence[stepCounter.count];
  const note = notes[stepVal] + drunk.val;
  stepCounter.tick();
  osc1.frequency.value = Tone.Frequency.mtof(note);
  osc2.frequency.value = Tone.Frequency.mtof(note - 5);
  Tone.Draw.schedule(function() {
    //layers[sequence[stepCounter.count]].mesh.visible = true;
    //layers[sequence[(stepCounter.count + 15) % 16]].mesh.visible = false;
    for (let i = 0; i < materials.length; i++) {
      materials[i].color = blue;
      materials[i].opacity = 0.5;
    }
    patterns[stepVal].forEach(index => {
      materials[index].color = lightColor;
      materials[index].opacity = lightOpacity;
    });
  }, time);
}, 0.125).start(0);

let randomLoop = new Tone.Loop(function(time) {
  noiseGain.gain.linearRampToValueAtTime(Math.random() * 1.0 + 1.5, '+2');
}, 2).start(0);

let cameraPosition = new THREE.Vector3(0, 0, 0);

const loopTime = 0.05;
const timeStamp = `+${loopTime}`;

let cameraPositionLoop = new Tone.Loop(function(time) {
  cameraPosition.copy(camera.position);
  cameraPosition.normalize();
  filter.frequency.linearRampToValueAtTime(
    Math.pow(2, 10 + 4 * cameraPosition.x),
    timeStamp
  );
  filter.Q.linearRampToValueAtTime(
    Math.pow(2, 1 + 3 * cameraPosition.y),
    timeStamp
  );
  filter.gain.linearRampToValueAtTime(25 + 10 * cameraPosition.z, timeStamp);
  Tone.Draw.schedule(function() {
    pixelPass.uniforms[ "pixelSize" ].value = 15 + cameraPosition.z * 14;
  }, time);
}, loopTime).start(0);
