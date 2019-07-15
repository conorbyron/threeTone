import * as THREE from 'three';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/*
let path = new THREE.Path();
path.moveTo(0, 8);
path.quadraticCurveTo(0, 10, 2, 10);
path.lineTo(8, 10);
path.quadraticCurveTo(10, 10, 10, 8);
path.lineTo(10, 2);
path.quadraticCurveTo(10, 0, 8, 0);
path.lineTo(2, 0);
path.quadraticCurveTo(0, 0, 0, 2);
path.closePath();
*/

/* NEXT STEPS:

- Need to abstract the curve creation so that position and shape can be changed on the fly.
- Define a portion of the curve that will then be repeated symmetrically.
- Figure out how to make it glow slightly.
- Add some sort of FBO to create an infinity mirror effect.

*/

let points = [];
points.push(new THREE.Vector3(0, 2, 0));
points.push(new THREE.Vector3(0, 8, 0));
points.push(new THREE.Vector3(2, 10, 0));
points.push(new THREE.Vector3(8, 10, 0));
points.push(new THREE.Vector3(10, 8, 0));
points.push(new THREE.Vector3(10, 2, 0));
points.push(new THREE.Vector3(8, 0, 0));
points.push(new THREE.Vector3(2, 0, 0));

let displacement = new THREE.Vector3(-5, -5, 0);
points.forEach(point => { point.add(displacement); });

// path
let path = new THREE.CatmullRomCurve3(points);
path.closed = true;

let geometry = new THREE.TubeBufferGeometry(path, null, 0.5, null, true);
let material = new THREE.MeshBasicMaterial({ color: 0x0066ff });
let mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.z = 15;

let animate = function () {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
};
animate();