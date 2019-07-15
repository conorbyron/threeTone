import * as THREE from 'three';
import Tone from 'tone';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0xf8f8f8);

let spheres = [];

let sphereMaterialGreen = new THREE.MeshLambertMaterial({ color: 0x0ce4f2 });
let sphereMaterialIndigo = new THREE.MeshLambertMaterial({ color: 0x391c90 });

const spread = 75;
const numBubbles = 500;

for (let i = 0; i < numBubbles; i++) {
    let sphereGeo = new THREE.SphereBufferGeometry(1, 8, 8);
    let sphere = new THREE.Mesh(sphereGeo, (i % 2 == 0) ? sphereMaterialGreen : sphereMaterialIndigo);
    sphere.position.set(spread * Math.random() - spread / 2, spread * Math.random() - spread / 2, -i);
    scene.add(sphere);
    spheres.push(sphere);
}

scene.fog = new THREE.Fog(new THREE.Color(0xf8f8f8), 0, 700);

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
    switch (e.key) {
        case ' ':
            filter.context.resume();
            if (!down) {
                down = true;
                e.preventDefault();
                filter.frequency.rampTo(100, 2);
                accelerating = false;
            }
            break;
    }
};

const mouseUp = e => {
    switch (e.key) {
        case ' ':
            down = false;
            e.preventDefault();
            filter.frequency.rampTo(2000, 4);
            accelerating = true;
            break;
    }
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
