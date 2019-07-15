import * as THREE from 'three';
//import Tone from 'tone';

/*
Create elements in the scene and animate them with more than constant, universally applied functions.

Two ways this could be accomplished:
- The properties of the elements are updated based on their relation to other elements in the scene.
eg. gravitation, dependent on relative position.
- The properties of the objects are updated based on a given sequence over time.
*/

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();