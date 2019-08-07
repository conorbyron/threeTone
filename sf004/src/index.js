import * as THREE from 'three';
//import OrbitControls from 'three-orbitcontrols';
//import Tone from 'tone';

// What I want to implement is a tape loop type structure for gestures using the circular buffer.

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//let controls = new OrbitControls(camera, renderer.domElement);
//controls.enableZoom = true;

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