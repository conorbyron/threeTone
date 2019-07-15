import * as THREE from 'three';
//import Tone from 'tone';

/*
I want to render geometries just with lines representing their edges, similar to the style of Vib Ribbon.
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