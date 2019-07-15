import * as THREE from 'three';
import fscreen from 'fscreen';
import { System, Orbit, Node } from './objects'
//import Tone from 'tone';

/*
This is meant to be a prototyping environment for the Katamari/SimCity mashup game.

What are the basic mechanics of the system? What are the basic shapes used?
Start with:
- Circles to represent orbitting node and orbit itself.
- Lines from centre to node, or from node in one orbit level to another.

A webassembly backend could become useful quickly...
If that happens, use specs.
*/

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let height = window.innerHeight;
let width = window.innerWidth;
let camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 2000);
camera.position.z = 10;

if (fscreen.fullscreenEnabled) {
    fscreen.addEventListener('fullscreenchange', handler, false);
}

let system = new System(10);
system.focus = 0;
scene.add(system);


const commands = {
    ' ': [() => { system.randomise(); }],
    'a': [() => { system.toggleMark(); }],
    'ArrowUp': [() => { system.updateFocus(-1); }],
    'ArrowDown': [() => { system.updateFocus(1); }],
    'ArrowLeft': [() => { system.accelerate(0.5); }, () => { system.accelerate(0); }],
    'ArrowRight': [() => { system.accelerate(-0.5); }, () => { system.accelerate(0); }],
    'f': [
        () => {
            if (fscreen.fullscreenElement)
                fscreen.exitFullscreen();
            else
                fscreen.requestFullscreen(document.body);
        }]
}

const keyDown = e => {
    if (commands[e.key]) {
        if (!commands[e.key].down) {
            let action = commands[e.key][0];
            if (action) action();
            commands[e.key].down = true;
        }
    }
}

const keyUp = e => {
    if (commands[e.key]) {
        let action = commands[e.key][1];
        if (action) action();
        commands[e.key].down = false;
    }
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    height = window.innerHeight;
    width = window.innerWidth;
    renderer.setSize(width, height);
    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();
}

function handler() {
    if (fscreen.fullscreenElement !== null) {
        console.log('Entered fullscreen mode');
    } else {
        console.log('Exited fullscreen mode');
    }
}

const animate = () => {
    requestAnimationFrame(animate);
    system.update();
    renderer.render(scene, camera);
};

animate();