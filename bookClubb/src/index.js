import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import onetwoeight from 'onetwoeight';

Document.body.style.cursor = 'none';

let bpm = new onetwoeight();
let radius = 2.5;

const drawingWidth = 200;
const drawingHeight = 100;
let green = false;
let pink = false;
let blue = false;
let erase = false;
let clear = false;
let currentColor = THREE.Vector3(0.0, 0.0, 0.0);
let drawMode = 0;
let cursorPosition = new THREE.Vector2(50, 50);

let steps = [];
for (let n = 0; n < 16; n++) {
    steps.push([false, false, false]);
}

const VERTEX_SHADER = `
precision highp float;
precision highp int;
attribute vec3 color;
attribute float pSize;
attribute float pOpacity;
uniform float size;
uniform float scale;
varying vec3 vColor;

uniform float factor;
uniform float time;
uniform float height;
uniform vec2 texResolution;
uniform sampler2D paint;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

void main() {
    float n = snoise(time + position * factor);
    float m = snoise(time + position * 0.5 * factor);
    vec2 uv = (position + vec3(texResolution.x/2.0, 0.0, texResolution.y)).xz / texResolution;
    vColor = vec3(0.0, 0.0, 0.0);
    vColor = texture2D(paint, uv).rgb;
    vec4 mvPosition = modelViewMatrix * vec4( position + vec3(0, n*height, 0), 1.0 );
    gl_PointSize = 6.0 + 2.0*snoise(position); // * pSize * size * ( scale / length( mvPosition.xyz ) );
    gl_Position = projectionMatrix * mvPosition;
}
`;
const FRAGMENT_SHADER = `
precision highp float;
precision highp int;
varying vec3 vColor;
uniform vec2 resolution;
uniform float time;
    
void main() {
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    if (dot(circCoord, circCoord) > 1.0) {
        discard;
    }
    float i = 1.0-smoothstep(0.0, 0.5, dot(circCoord, circCoord));
	float gi = 1.0-smoothstep(0.0, 1.0, dot(circCoord, circCoord));
    vec4 f = vec4(i*(gl_FragCoord.x/resolution.x),i*(gl_FragCoord.y/resolution.y),i,1.0);
    gl_FragColor = vec4(vColor, 1.0); 
}
`;

const FRAGMENT_SHADER_BUFFER = `
precision highp float;
precision highp int;

uniform vec2 cursorPosition;
uniform float radius;
uniform vec3 colour;
uniform int drawMode;
uniform vec2 resolution;
uniform sampler2D paint;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    gl_FragColor = texture2D(paint, uv);
    if(drawMode == 1) {
        if (distance(gl_FragCoord.xy, cursorPosition) <= radius) {
            gl_FragColor = vec4(colour, 1.0);
        }
    }
    if(drawMode == 2) {
        if (distance(gl_FragCoord.xy, cursorPosition) <= radius) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
    if(drawMode == 3) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`;

const FRAGMENT_SHADER_CURSOR = `
precision highp float;
precision highp int;

uniform vec2 cursorPosition;
uniform float radius;
uniform vec2 resolution;
uniform sampler2D paint;

float stroke(float x, float s, float w) {
    float d = step(s, x+w*0.5) - step(s, s-w*0.5);
    return clamp(d, 0.0, 1.0);
}

float circleSDF(vec2 st) {
    return length(st - 0.5) * 2.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    gl_FragColor = texture2D(paint, uv);
    float dis = distance(gl_FragCoord.xy, cursorPosition);
    if (dis >= radius - 1.0 && dis <= radius + 1.0) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
}
`;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 80, -50);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 50);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

let geometry = new THREE.Geometry();

const renderTargetParams = {
    stencilBuffer: false,
    depthBuffer: false
};

let targetA = new THREE.WebGLRenderTarget(drawingWidth, drawingHeight, renderTargetParams);
let targetB = new THREE.WebGLRenderTarget(drawingWidth, drawingHeight, renderTargetParams);
let targetC = new THREE.WebGLRenderTarget(drawingWidth, drawingHeight, renderTargetParams);

let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        factor: { type: "f", value: 0.05 },
        hue: { type: "f", value: 0.0 },
        height: { type: "f", value: 3.0 },
        time: { type: "f", value: 0 },
        resolution: { type: "v2", value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) },
        texResolution: { type: "v2", value: new THREE.Vector2(drawingWidth, drawingHeight) },
        paint: { type: "t", value: targetB.texture },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
});

//let material = new THREE.PointsMaterial({ color: 0xffff00, size: 0.1 });
let pointCloud = new THREE.Points(geometry, shaderMaterial);
scene.add(pointCloud);

for (let i = 0; i < 10000; i++) {
    geometry.vertices.push(new THREE.Vector3(Math.random() * drawingWidth - drawingWidth / 2, 0, -Math.random() * drawingHeight));
}

let bufferScene = new THREE.Scene();


let bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
        colour: { type: "v3", value: currentColor },
        drawMode: { type: "i", value: drawMode },
        radius: { type: "f", value: radius },
        cursorPosition: { type: "v2", value: cursorPosition },
        paint: { type: "t", value: targetA.texture },
        resolution: { type: "v2", value: new THREE.Vector2(drawingWidth, drawingHeight) },
    },
    fragmentShader: FRAGMENT_SHADER_BUFFER,
});

let plane = new THREE.PlaneBufferGeometry(drawingWidth, drawingHeight);
let bufferObject = new THREE.Mesh(plane, bufferMaterial);
bufferScene.add(bufferObject);

let bufferCamera = new THREE.OrthographicCamera(drawingWidth / - 2,
    drawingWidth / 2,
    drawingHeight / 2,
    drawingHeight / - 2, -10000, 10000);

bufferCamera.position.z = 2;

let cursorScene = new THREE.Scene();

let cursorMaterial = new THREE.ShaderMaterial({
    uniforms: {
        radius: { type: "f", value: radius },
        cursorPosition: { type: "v2", value: cursorPosition },
        paint: { type: "t", value: targetA.texture },
        resolution: { type: "v2", value: new THREE.Vector2(drawingWidth, drawingHeight) },
    },
    fragmentShader: FRAGMENT_SHADER_CURSOR,
});

let cursorPlane = new THREE.PlaneBufferGeometry(drawingWidth, drawingHeight);
let cursorObject = new THREE.Mesh(cursorPlane, cursorMaterial);
cursorScene.add(cursorObject);

let cursorCamera = new THREE.OrthographicCamera(drawingWidth / - 2,
    drawingWidth / 2,
    drawingHeight / 2,
    drawingHeight / - 2, -10000, 10000);

cursorCamera.position.z = 2;

function setStep(num) {
    const stepToSet = 4 * (nextStep - Date.now()) / beatLength > 0.5 ? step : (step + 1) % 16;
    steps[stepToSet][num] = true;
}

const keyDown = e => {
    switch (e.key) {
        case '1':
            e.preventDefault();
            setStep(0);
            break;
        case '2':
            e.preventDefault();
            setStep(1);
            break;
        case '3':
            e.preventDefault();
            setStep(2);
            break;
        case ' ':
            e.preventDefault();
            //renderer.clear();
            break;
        case 'z':
            e.preventDefault();
            bpm.tap();
            const rate = bpm.bpm(true);
            if (rate) {
                beatLength = 60000 / rate;
            }
            break;
    }
}

window.addEventListener('keydown', keyDown);

let temp = targetB;

// ~~~ audio timing
let beatLength = 500;
let step = 0;
let nextStep = Date.now() + beatLength / 4;

/// ~~~ gamepad
function buttonPressed(b) {
    if (typeof (b) == "object") {
        return b.pressed;
    }
    return b == 1.0;
}

function poll() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    if (!gamepads) {
        return;
    }

    let gp = gamepads[0];
    if (gp) {
        for (let i = 0; i < 16; i++) {
            switch (i) {
                case 0:
                    if (gp.buttons[i]) radius += 0.05;
                    break;
                case 1:
                    if (gp.buttons[i]) radius -= 0.05;
                    break;
                case 3:
                    if (gp.buttons[i]) {
                        if (green === false) {
                            green = true;
                            currentColor.set(1, 0, 0);
                            console.log('1');
                            drawMode = 1;
                        }
                    }
                    else { green === false };
                    break;
                case 5:
                    if (gp.buttons[i]) {
                        if (pink === false) {
                            pink = true;
                            currentColor.set(0, 1, 0);
                            console.log('2');
                            drawMode = 1;
                        }
                    }
                    else { pink === false };
                    break;
                case 4:
                    if (gp.buttons[i]) {
                        if (blue === false) {
                            blue = true;
                            currentColor.set(0, 0, 1);
                            console.log('3');
                            drawMode = 1;
                        }
                    }
                    else { blue === false };
                    break;
                case 2:
                    if (gp.buttons[i]) {
                        if (erase === false) {
                            erase = true;
                            currentColor.set(0, 0, 0);
                            drawMode = 2;
                        }
                    }
                    else { erase === false };
                    break;
                case 7:
                    if (gp.buttons[i]) {
                        if (clear === false) {
                            clear = true;
                            currentColor.set(0, 0, 0);
                            drawMode = 3;
                        }
                    }
                    else { clear === false };
                    break;
                default:
                    break;
            }
        }
        const stick = gp.axes[9];
        let moveCursorX = 0.0;
        let moveCursorY = 0.0;
        const moveCursorAmt = 2.0;
        if (stick === 1) {
            console.log('nw');
            moveCursorX = 0.5;
            moveCursorY = 0.5;
        }
        else if (stick < 0.72 && stick > 0.7) {
            console.log('w');
            moveCursorX = 1.0;
        }
        else if (stick < 0.43 && stick > 0.4) {
            console.log('sw');
            moveCursorX = 0.5;
            moveCursorY = -0.5;
        }
        else if (stick < 0.15 && stick > 0.13) {
            console.log('s');
            moveCursorY = -1.0;
        }
        else if (stick < -0.13 && stick > -0.15) {
            console.log('se');
            moveCursorX = -0.5;
            moveCursorY = -0.5;
        }
        else if (stick < -0.4 && stick > -0.43) {
            console.log('e');
            moveCursorX = -1.0;
        }
        else if (stick < -0.7 && stick > -0.72) {
            console.log('ne');
            moveCursorX = -0.5;
            moveCursorY = 0.5;
        }
        else if (stick === -1) {
            console.log('n');
            moveCursorY = 1.0;
        }
        else {
            //console.log('off');
        }

        if (moveCursorX || moveCursorY) {
            cursorPosition.x += moveCursorX * moveCursorAmt;
            cursorPosition.y += moveCursorY * moveCursorAmt;

            if (cursorPosition.x < 0) cursorPosition.x = 0;
            if (cursorPosition.y < 0) cursorPosition.y = 0;
            if (cursorPosition.x > drawingWidth) cursorPosition.x = drawingWidth;
            if (cursorPosition.y > drawingHeight) cursorPosition.y = drawingHeight;

            bufferMaterial.uniforms.cursorPosition.value = cursorPosition;
            cursorMaterial.uniforms.cursorPosition.value = cursorPosition;
        }

    }
}

let notesInProgress = [0.0, 0.0, 0.0];

function playStep(stepNum) {


}

function playNote() {

}

function updateNotes() {
    notesInProgress.forEach(val => { if (val > 0.0) { val -= 0.01 } });
}

function clearNotes() {

}

let animate = function () {
    requestAnimationFrame(animate);
    poll();
    const now = Date.now();
    if (now >= nextStep) {
        nextStep = now + beatLength / 4;
        step++;
        if (step >= 16) { step = 0; }
        playStep(step);
        //console.log(step);
    }
    renderer.render(bufferScene, bufferCamera, targetB, true);
    temp = targetA;
    targetA = targetB;
    targetB = temp;
    bufferMaterial.uniforms.paint.value = targetA.texture;

    cursorMaterial.uniforms.paint.value = targetB.texture;
    renderer.render(cursorScene, cursorCamera, targetC, true);

    bufferMaterial.uniforms.radius.value = radius;
    bufferMaterial.uniforms.drawMode.value = drawMode;
    bufferMaterial.uniforms.colour.value = currentColor;
    cursorMaterial.uniforms.radius.value = radius;

    shaderMaterial.uniforms.paint.value = targetC.texture;
    shaderMaterial.uniforms.time.value += 0.005;
    renderer.render(scene, camera);
};
animate();
