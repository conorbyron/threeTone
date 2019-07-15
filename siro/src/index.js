import * as THREE from 'three';
import { OrbitControls } from 'three-addons';
//import Tone from 'tone';

const VERTEX_SHADER_ELLIPSOID = `
varying vec3 vPosition;
uniform float scale;
uniform float time;
uniform float height;

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
  vPosition = position;
  float n = snoise(time + vPosition * scale) + 0.5;
  //float m = snoise(time + vPosition * 0.5 * scale);
  vec3 pos = position + n*height*normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}
`;
const FRAGMENT_SHADER_ELLIPSOID = `
varying vec3 vPosition;
uniform float scale;
uniform float hue;
uniform float time;

float hue2rgb(float f1, float f2, float h) {
  if (h < 0.0)
      h += 1.0;
  else if (h > 1.0)
      h -= 1.0;
  float res;
  if ((6.0 * h) < 1.0)
      res = f1 + (f2 - f1) * 6.0 * h;
  else if ((2.0 * h) < 1.0)
      res = f2;
  else if ((3.0 * h) < 2.0)
      res = f1 + (f2 - f1) * ((2.0 / 3.0) - h) * 6.0;
  else
      res = f1;
  return res;
}

vec3 hsl2rgb(vec3 hsl) {
  vec3 rgb;
  
  if (hsl.y == 0.0) {
      rgb = vec3(hsl.z); // Luminance
  } else {
      float f2;
      
      if (hsl.z < 0.5)
          f2 = hsl.z * (1.0 + hsl.y);
      else
          f2 = hsl.z + hsl.y - hsl.y * hsl.z;
          
      float f1 = 2.0 * hsl.z - f2;
      
      rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
      rgb.g = hue2rgb(f1, f2, hsl.x);
      rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
  }   
  return rgb;
}

vec3 hsl2rgb(float h, float s, float l) {
  return hsl2rgb(vec3(h, s, l));
}

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
  float n = snoise(time + vPosition * scale) + 0.5;
  //float m = snoise(time + vPosition * 0.5 * scale);
  // Original colours.
  /*
  float r = 1.0 - (1.0 - 93.0/255.0) * n  - (1.0 - 100.0/255.0) * m;
  float g = 1.0 - (1.0 - 130.0/255.0) * n  - (1.0 - 100.0/255.0) * m;
  float b = 1.0 - (1.0 - 158.0/255.0) * n  - (1.0 - 180.0/255.0) * m;
  float r = 1.0 - n  - m;
  float g = 1.0 - n  - m;
  float b = 1.0 - n  - m;
  */
  vec3 color = hsl2rgb(hue, 1.0, 0.5);
  float r = 1.0 - (1.0 - color.r) * n; 
  float g = 1.0 - (1.0 - color.g) * n;
  float b = 1.0 - (1.0 - color.b) * n;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

const VERTEX_SHADER_GLOW = `
varying vec3 vNormal;
void main() 
{
    vNormal = normalize( normalMatrix * normal );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const FRAGMENT_SHADER_GLOW = `
varying vec3 vNormal;
void main() 
{
	float intensity = pow( 0.7 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0 ); 
    gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;
}
`;

class CircularBuffer {
  constructor(len, val) {
    this.buffer = Array(len).fill(val);
    this.index = 0;
  }

  push(value) {
    this.buffer[this.index] = value;
    this.index++;
    if (this.index >= this.buffer.length) {
      this.index = 0;
    }
  }

  mean() {
    const sum = this.buffer.reduce((a, b) => a + b, 0);
    return sum / this.buffer.length;
  }
}

let alphaBuffer = new CircularBuffer(20, 0.5);
let betaBuffer = new CircularBuffer(30, 0.5);
let deltaBuffer = new CircularBuffer(20, 0.5);

let alpha = 0.0;
let beta = 0.0;
let delta = 0.0;

const webSocket = new WebSocket('ws://localhost:3000');
webSocket.onmessage = function (event) {
  const message = JSON.parse(event.data);
  switch (message.wave) {
    case 'alpha':
      alpha = message.value;
      break;
    case 'beta':
      beta = message.value;
      betaBuffer.push(beta);
      break;
    case 'delta':
      delta = message.value;
      deltaBuffer.push(delta);
      break;
  }
}

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    scale: { type: "f", value: 0.199 }, //setting this to  exactly 2.0 causes weird glitches in the vertices...
    hue: { type: "f", value: 0.0 },
    height: { type: "f", value: 1.0 },
    time: { type: "f", value: 0 },
  },
  vertexShader: VERTEX_SHADER_ELLIPSOID,
  fragmentShader: FRAGMENT_SHADER_ELLIPSOID,
});

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true; // Doesn't work!

let eggRadius = 5;
let eggVertScale = 2.6;
let baseHeight = 2;

let geometry = new THREE.SphereGeometry(5, 64, 128);
geometry.applyMatrix(new THREE.Matrix4().makeScale(1.0, 2.4, 1.0));
let mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

var glowMaterial = new THREE.ShaderMaterial(
  {
    uniforms: {},
    vertexShader: VERTEX_SHADER_GLOW,
    fragmentShader: FRAGMENT_SHADER_GLOW,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

geometry = new THREE.SphereGeometry(5, 64, 64);
geometry.applyMatrix(new THREE.Matrix4().makeScale(1.2, 2.8, 1.2));
var glow = new THREE.Mesh(geometry, glowMaterial);
//scene.add(glow);

geometry = new THREE.CylinderGeometry(8, 8, 2, 32);
let material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, recieveShadow: true, });
let base = new THREE.Mesh(geometry, material);
base.position.y = -(eggRadius * eggVertScale + baseHeight / 2);
//scene.add(base);

geometry = new THREE.PlaneGeometry(30, 30, 32);
let plane = new THREE.Mesh(geometry, material);
plane.rotation.x = Math.PI * -0.5;
plane.position.y = -(eggRadius * eggVertScale + baseHeight);
//scene.add(plane);

let light = new THREE.PointLight(0x193366, 1, 100);
//scene.add(light);

camera.position.z = 25;
camera.position.y = 5;
camera.lookAt(0, 0, 0);
controls.update();

//const initialTime = Date.now();
let time = 0;
let maxAlpha = 1;
let maxBeta = 0.6;
let minBeta = 0.4;
let maxDelta = 0.6;
let minDelta = 0.4;
let animate = function () {
  requestAnimationFrame(animate);
  if (alpha > maxAlpha) maxAlpha = alpha;
  if (beta > maxBeta) maxBeta = beta;
  else if (beta < minBeta) minBeta = beta;
  if (delta > maxDelta) maxDelta = delta;
  else if (delta < minDelta) minDelta = delta;
  time += (maxAlpha - alpha);
  alphaBuffer.push((maxAlpha - alpha)/maxAlpha);
  shaderMaterial.uniforms.time.value = time / 100;
  shaderMaterial.uniforms.hue.value = 0.7 - 0.7*(betaBuffer.mean()-minBeta)/(maxBeta-minBeta);
  shaderMaterial.uniforms.height.value = deltaBuffer.mean();
  renderer.render(scene, camera);
};
animate();