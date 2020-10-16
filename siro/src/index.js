import * as THREE from 'three'
import OrbitControls from 'three-orbitcontrols'
import ellipsoidVert from './glsl/ellipsoid.vert'
import ellipsoidFrag from './glsl/ellipsoid.frag'
//import Tone from 'tone';

const VERTEX_SHADER_GLOW = `
varying vec3 vNormal;
void main() 
{
    vNormal = normalize( normalMatrix * normal );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const FRAGMENT_SHADER_GLOW = `
varying vec3 vNormal;
void main() 
{
	float intensity = pow( 0.7 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0 ); 
    gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;
}
`

class CircularBuffer {
  constructor(len, val) {
    this.buffer = Array(len).fill(val)
    this.index = 0
  }

  push(value) {
    this.buffer[this.index] = value
    this.index++
    if (this.index >= this.buffer.length) {
      this.index = 0
    }
  }

  mean() {
    const sum = this.buffer.reduce((a, b) => a + b, 0)
    return sum / this.buffer.length
  }
}

let alphaBuffer = new CircularBuffer(20, 0.5)
let betaBuffer = new CircularBuffer(30, 0.5)
let deltaBuffer = new CircularBuffer(20, 0.5)

let alpha = 0.0
let beta = 0.0
let delta = 0.0

const webSocket = new WebSocket('ws://localhost:3000')
webSocket.onmessage = function(event) {
  const message = JSON.parse(event.data)
  switch (message.wave) {
    case 'alpha':
      alpha = message.value
      break
    case 'beta':
      beta = message.value
      betaBuffer.push(beta)
      break
    case 'delta':
      delta = message.value
      deltaBuffer.push(delta)
      break
  }
}

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    scale: { type: 'f', value: 0.199 }, //setting this to  exactly 2.0 causes weird glitches in the vertices...
    hue: { type: 'f', value: 0.0 },
    height: { type: 'f', value: 1.0 },
    time: { type: 'f', value: 0 }
  },
  vertexShader: ellipsoidVert,
  fragmentShader: ellipsoidFrag
})

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = true // Doesn't work!

let eggRadius = 5
let eggVertScale = 2.6
let baseHeight = 2

let geometry = new THREE.SphereGeometry(5, 64, 128)
geometry.applyMatrix(new THREE.Matrix4().makeScale(1.0, 2.4, 1.0))
let mesh = new THREE.Mesh(geometry, shaderMaterial)
scene.add(mesh)

var glowMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: VERTEX_SHADER_GLOW,
  fragmentShader: FRAGMENT_SHADER_GLOW,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true
})

geometry = new THREE.SphereGeometry(5, 64, 64)
geometry.applyMatrix(new THREE.Matrix4().makeScale(1.2, 2.8, 1.2))
var glow = new THREE.Mesh(geometry, glowMaterial)
//scene.add(glow);

geometry = new THREE.CylinderGeometry(8, 8, 2, 32)
let material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  recieveShadow: true
})
let base = new THREE.Mesh(geometry, material)
base.position.y = -(eggRadius * eggVertScale + baseHeight / 2)
//scene.add(base);

geometry = new THREE.PlaneGeometry(30, 30, 32)
let plane = new THREE.Mesh(geometry, material)
plane.rotation.x = Math.PI * -0.5
plane.position.y = -(eggRadius * eggVertScale + baseHeight)
//scene.add(plane);

let light = new THREE.PointLight(0x193366, 1, 100)
//scene.add(light);

camera.position.z = 25
camera.position.y = 5
camera.lookAt(0, 0, 0)
controls.update()

//const initialTime = Date.now();
let time = 0
let maxAlpha = 1
let maxBeta = 0.6
let minBeta = 0.4
let maxDelta = 0.6
let minDelta = 0.4
let animate = function() {
  requestAnimationFrame(animate)
  if (alpha > maxAlpha) maxAlpha = alpha
  if (beta > maxBeta) maxBeta = beta
  else if (beta < minBeta) minBeta = beta
  if (delta > maxDelta) maxDelta = delta
  else if (delta < minDelta) minDelta = delta
  time += maxAlpha - alpha
  alphaBuffer.push((maxAlpha - alpha) / maxAlpha)
  shaderMaterial.uniforms.time.value = time / 100
  shaderMaterial.uniforms.hue.value =
    0.7 - (0.7 * (betaBuffer.mean() - minBeta)) / (maxBeta - minBeta)
  shaderMaterial.uniforms.height.value = deltaBuffer.mean()
  renderer.render(scene, camera)
}
animate()
