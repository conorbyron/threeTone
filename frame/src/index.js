import * as THREE from 'three';
//import Tone from 'tone';

/*
I want to generate pipes like those in the Windows screensaver. 
After I have the generative code for pipes, I want to be able to construct frames of intersecting pipes.

What I need first is a corner <shape>.
- Maybe I can design a collection of building pieces. Corners are a must; do I need to handle joints?
*/

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

class EllipseCurve3d extends THREE.Curve {
    constructor(ellipseCurve2d, z = 0) {
        super();
        this.curve2d = ellipseCurve2d;
        this.zVal = z;
    }
    getPoint(t) {
        const p = this.curve2d.getPoint(t);
        return new THREE.Vector3(p.x, p.y, this.zVal);
    }
}

let curve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    2, 2,           // xRadius, yRadius
    0, 0.5 * Math.PI,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);
curve.closed = false;

let frame = new THREE.Group();

let geometry = new THREE.TubeGeometry(new EllipseCurve3d(curve), null, 0.5, null, false);
let material = new THREE.MeshBasicMaterial({ color: 0x0066ff });
let mesh = new THREE.Mesh(geometry, material);
frame.add(mesh);

geometry = new THREE.CylinderGeometry( 0.5, 0.5, 4);
let tube1 = new THREE.Mesh(geometry, material);
let tube2 = new THREE.Mesh(geometry, material);
tube1.rotateZ(Math.PI * 0.5);
tube1.position.set(-2, 2, 0);
tube2.position.set(2, -2, 0);
frame.add(tube1);
frame.add(tube2);

scene.add(frame);

camera.position.z = 15;

let animate = function () {
    requestAnimationFrame(animate);
    frame.rotation.x += 0.01;
    frame.rotation.y += 0.01;
    renderer.render(scene, camera);
};
animate();
