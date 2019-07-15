import * as THREE from 'three';

const FRAGMENT_SHADER = `
precision highp float;
precision highp int;

uniform vec2 resolution;
uniform vec2 cursorPosition;
uniform float time;

void main() {
    vec2 uv = (gl_FragCoord.xy/resolution);
    float cY = 1.0 - (cursorPosition/resolution).y;
    float cX = (cursorPosition/resolution).x;
    if(uv.y > (cY - 0.25) && uv.y < (cY + 0.25)) {
        uv.x += smoothstep(cY - 0.24, cY - 0.2, uv.y) * smoothstep(cY + 0.24, cY + 0.2, uv.y) * sin(uv.y * 60.0 - time * 2.0) * cX * 0.05;
    }
    float x1 = sin(uv.x * 500.0)/2.0 + 0.5;
    float x2 = sin(time * (1.0 + cX) * 3.0) + sin(time * (1.0 + cY) * 3.0); 
    gl_FragColor = vec4(0.3*(1.0-x2), 1.0 - x1, 0.3+x1, 1.0); 
}
`;

let width = window.innerWidth;
let height = window.innerHeight;

let renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

//document.body.style.cursor = 'none';
let cursorPosition = new THREE.Vector2(50, 50);

let scene = new THREE.Scene();

let material = new THREE.ShaderMaterial({
    uniforms: {
        cursorPosition: { type: "v2", value: cursorPosition },
        time: { type: "f", value: 0 },
        resolution: { type: "v2", value: new THREE.Vector2(width, height) },
    },
    fragmentShader: FRAGMENT_SHADER,
});

let plane = new THREE.PlaneBufferGeometry(width, height);
let screen = new THREE.Mesh(plane, material);
scene.add(screen)

let camera = new THREE.OrthographicCamera(width / - 2,
    width / 2,
    height / 2,
    height / - 2, -10000, 10000);

camera.position.z = 2;

window.addEventListener('mousemove', e => {
    cursorPosition.set(e.clientX, e.clientY);
});

const startTime = Date.now();
let animate = function () {
    requestAnimationFrame(animate);
    material.uniforms.time.value = (Date.now() - startTime) / 100;
    material.uniforms.cursorPosition.value = cursorPosition;
    renderer.render(scene, camera);
};
animate();