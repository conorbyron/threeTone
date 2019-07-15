import * as THREE from 'three';
import Tone from 'tone';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const background = new THREE.Color(0x467ce6);

scene.background = background;

let spheres = [];

let lightGreen = new THREE.MeshToonMaterial({ color: 0x84c19f });
let darkGreen = new THREE.MeshToonMaterial({ color: 0x337d80 });
let pink = new THREE.MeshToonMaterial({ color: 0x391c90 });
let lavender = new THREE.MeshToonMaterial({ color: 0xbfabda });

const maxRadius = 100;
const numBubbles = 500;

for (let i = 0; i < numBubbles; i++) {
    let sphereGeo = new THREE.SphereBufferGeometry(1, 8, 8);
    let sphereMaterial = null;
    switch (i % 4) {
        case 0:
            sphereMaterial = lightGreen;
            break;
        case 1:
            sphereMaterial = darkGreen;
            break;
        case 2:
            sphereMaterial = lavender;
            break;
        case 3:
            sphereMaterial = pink;
            break;
    }

    let sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
    let radius = 5 + Math.random()*maxRadius;
    let theta = Math.random()*2*Math.PI;
    sphere.position.set(radius*Math.sin(theta), radius*Math.cos(theta), -i);
    scene.add(sphere);
    spheres.push(sphere);
}

scene.fog = new THREE.Fog(background, 0, 700);

const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const maxSpeed = 20;
const minSpeed = 0.3;

let speed = minSpeed;
let accelerating = true;

function update() {
    if (accelerating && speed < maxSpeed) {
        speed += 0.1;
    }
    else if (speed > minSpeed) {
        speed -= 0.2;
    }
    for (let i = 0; i < spheres.length; i++) {
        let sphere = spheres[i];
        sphere.position.z = -((numBubbles - speed - sphere.position.z) % numBubbles);
    }
}

let filter = new Tone.Filter(2000, "lowpass").toMaster();
let noise = new Tone.Noise("pink").connect(filter).start();

let down = false;

const mouseDown = e => {
    filter.context.resume();
    if (!down) {
        down = true;
        e.preventDefault();
        filter.frequency.rampTo(100, 2);
        accelerating = false;
    }
};

const mouseUp = e => {
    down = false;
    e.preventDefault();
    filter.frequency.rampTo(2000, 4);
    accelerating = true;
};

const mouseMove = e => {
    let x = (2 * e.clientX - window.innerWidth) / window.innerWidth;
    let y = (2 * e.clientY - window.innerHeight) / window.innerHeight;
    camera.position.set(50 * x, -50 * y, 0);
    camera.lookAt(new THREE.Vector3(0, 0, -500));
};

window.addEventListener('mousedown', mouseDown);
window.addEventListener('mouseup', mouseUp);
window.addEventListener('mousemove', mouseMove);

let animate = function () {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
};
animate();
