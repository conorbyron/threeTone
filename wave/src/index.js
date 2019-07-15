import * as THREE from 'three';
//import Tone from 'tone';

/*
Animate a sine wave over a plane.
*/

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.background = new THREE.Color(0xeeb5ff);
let geom = new THREE.Geometry();

const height = 200;
const width = 200;
const vertSpacing = 0.5;

const xVerts = width + 1;
const yVerts = height + 1;

for (let i = 0; i < xVerts * yVerts; i++) {
    const x = i % xVerts - width * vertSpacing;
    const y = Math.floor(i / yVerts) - height * vertSpacing;
    geom.vertices.push(new THREE.Vector3(x * vertSpacing, y * vertSpacing, 0));
}

for (let i = 0; i < height * width; i++) {
    const a = i + Math.floor(i / width);
    const b = a + 1;
    const c = a + xVerts;
    const d = c + 1;
    geom.faces.push(new THREE.Face3(a, b, c));
    geom.faces.push(new THREE.Face3(b, d, c));
}

let group = new THREE.Group();

let waveMaterial = new THREE.MeshPhongMaterial({ color: 0x39f9c0, emissive: 0x2dff, specular: 0xfa00fa });
waveMaterial.side = THREE.DoubleSide
let wave = new THREE.Mesh(geom, waveMaterial);

group.add(wave);

let box = new THREE.BoxGeometry(height * vertSpacing, width * vertSpacing, 30);
let edges = new THREE.EdgesGeometry(box);
var lineMaterial = new THREE.LineBasicMaterial({ color: 0x39f9c, linewidth: 8 });
let line = new THREE.LineSegments(edges, lineMaterial);
group.add(line);

let rectGeometry = new THREE.PlaneGeometry(height * vertSpacing, 30);
let wallMaterial = new THREE.MeshBasicMaterial({ color: 0x39f9c, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
let wall1 = new THREE.Mesh(rectGeometry, wallMaterial);
let wall2 = new THREE.Mesh(rectGeometry, wallMaterial);
let wall3 = new THREE.Mesh(rectGeometry, wallMaterial);
let wall4 = new THREE.Mesh(rectGeometry, wallMaterial);
wall1.rotation.x = Math.PI / 2;
wall1.position.y = width / 4;
wall2.rotation.x = Math.PI / 2;
wall2.rotation.y = Math.PI / 2;
wall2.position.x = width / 4;
wall3.rotation.x = Math.PI / 2;
wall3.position.y = -width / 4;
wall4.rotation.x = Math.PI / 2;
wall4.rotation.y = Math.PI / 2;
wall4.position.x = -width / 4;
group.add(wall1);
group.add(wall2);
group.add(wall3);
group.add(wall4);

var light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 0, 20);
scene.add(light);

scene.add(group);

/*
var sphereSize = 1;
var pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
scene.add( pointLightHelper );
*/

camera.position.set(60, 60, 60); // The orthographic space is defined from this point forward! Everything you want to see has to fit inside it.
camera.up.set(0, 0, 1); // You need to set the up vector here so that the camera will be correctly re-oriented after changing position to look down at the plane.
camera.lookAt(0, 0, 0)
camera.position.z = 40;

function updateWave() {
    const t = Date.now();
    geom.verticesNeedUpdate = true;
    wave.geometry.vertices.forEach((vert, i) => { vert.z = 1 * Math.sin(-Math.floor(i / xVerts) * 0.1 + t / 500); });
    wave.geometry.vertices.forEach((vert, i) => { vert.z += 2 * Math.sin(-Math.floor(i / xVerts) * 0.05 + t / 700); });
    wave.geometry.vertices.forEach((vert, i) => { vert.z *= 2 * Math.sin(i % xVerts * 0.1 + t / 800); });
    wave.geometry.vertices.forEach((vert, i) => { vert.z *= 1.5 * Math.sin(i % xVerts * 0.03 + t / 800); });
    wave.geometry.computeVertexNormals();
}

const animate = () => {
    requestAnimationFrame(animate);
    group.rotation.z += 0.003
    updateWave();
    renderer.render(scene, camera);
};

animate();