import * as THREE from 'three'
import vertexShader from './glsl/fluid.vert'
import fragmentShader from './glsl/fluid.frag'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as dat from 'dat.gui'

const gui = new dat.GUI()

let recorded = []
let recording = false
let playing = false
let playingFrame = 0

// need: detail of sin function (texture), speed, colour saturation, colour channel mixes, ...
let parameters = {
  detail: 6,
  feedback: 10,
  height: 2,
  rotationSpeed: 0,
  opacity: 1,
  white: 0,
  motionSpeed: 0.5,
  hue: 0.5,
  glow: 0.5,
  saturation: 0.5,
  record: function() {
    recorded = []
    recording = true
    gui.stopController = gui.add(this, 'stop')
    gui.remove(gui.recordController)
    if (gui.playController) gui.remove(gui.playController)
    if (gui.downloadController) gui.remove(gui.downloadController)
  },
  stop: function() {
    recording = false
    playing = false
    gui.recordController = gui.add(parameters, 'record')
    gui.playController = gui.add(parameters, 'playRecording')
    gui.downloadController = gui.add(parameters, 'downloadRecording')
    gui.remove(gui.stopController)
  },
  playRecording: function() {
    playingFrame = 0
    playing = true
    gui.stopController = gui.add(parameters, 'stop')
    gui.remove(gui.recordController)
    gui.remove(gui.playController)
    gui.remove(gui.downloadController)
  },
  downloadRecording: function() {
    const filename = prompt('Please enter a filename. ([filename].json)')
    download(filename, JSON.stringify(recorded))
  }
}

gui.add(parameters, 'detail', 0, 10).step(1)
gui.add(parameters, 'feedback', 1, 10).step(0.05)
gui.add(parameters, 'opacity', 0, 1).step(0.05)
gui.add(parameters, 'white', 0, 1).step(0.05)
gui.add(parameters, 'motionSpeed', 0, 2).step(0.05)
gui.add(parameters, 'hue', 0, 1).step(0.001)
gui.add(parameters, 'glow', 0, 2).step(0.01)
gui.add(parameters, 'saturation', 0, 1).step(0.05)
gui.add(parameters, 'height', 0, 5)
gui.add(parameters, 'rotationSpeed', -5, 5).step(0.1)
gui.recordController = gui.add(parameters, 'record')

class Elastic {
  constructor(initialValue, frames) {
    this.value = initialValue
    this.lastParameterValue = initialValue
    this.frames = frames
    this.currentIncrement = 0
  }

  next(parameterValue) {
    if (Math.abs(parameterValue - this.value) > 0.01) {
      if (Math.abs(parameterValue - this.lastParameterValue) > 0.01) {
        this.currentIncrement = (parameterValue - this.value) / this.frames
      }
      this.value += this.currentIncrement
    }
    return this.value
  }
}

class CircularBuffer {
  constructor(len, val) {
    this.buffer = Array(len).fill(val)
    this.index = 0
    this.zeros = 0
  }

  push(value) {
    this.buffer[this.index] = value
    this.index++
    if (this.index >= this.buffer.length) this.index = 0
    if (value == 0) this.zeros++
    else this.zeros = 0
  }

  mean() {
    const sum = this.buffer.reduce((a, b) => a + b, 0)
    return sum / this.buffer.length
  }
}

function download(filename, text) {
  const a = document.createElement('a')
  a.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  )
  a.setAttribute('download', filename + '.json')

  a.style.display = 'none'
  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
}

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
//renderer.toneMapping = THREE.ReinhardToneMapping
document.body.appendChild(renderer.domElement)

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { type: 'f', value: 0 },
    detail: { type: 'i', value: parameters.detail },
    feedback: { type: 'f', value: parameters.feedback },
    height: { type: 'f', value: parameters.height },
    // should the initial values of these uniforms be set from the buffers?
    hue: { type: 'f', value: 0 },
    saturation: { type: 'f', value: 0.5 },
    interpolation: { type: 'f', value: 0 },
    opacity: { type: 'f', value: 0.5 }
  },
  vertexShader,
  fragmentShader
})

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

let controls = new OrbitControls(camera, renderer.domElement)

let geometry = new THREE.SphereGeometry(5, 512, 1024)
geometry.applyMatrix(new THREE.Matrix4().makeScale(1.0, 2.4, 1.0))
let mesh = new THREE.Mesh(geometry, shaderMaterial)
scene.add(mesh)

/*
Total Dark
Put on headset-Monolith lighten
5secs pause (bright, white, Monolith)
Monolith comes closer - Image starts to fade in
20secs - Monolith is in full size
If user takes off headset, Monolith turns to dark again (disappears)
*/

// turn this into a class, instantiate an object exactly like this for the camera zoom, and create one changing from white to the h & s values from the relevant channels.
// you'll have to change the fragment shader to follow an interpolation uniform

camera.position.z = 25
camera.position.y = 5
camera.lookAt(0, 0, 0)
controls.update()

let renderScene = new RenderPass(scene, camera)

let bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.0,
  1.0,
  0.0
)

let composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

let time = 0

let numFrames = 10
let elasticOpacity = new Elastic(parameters.opacity, numFrames)
let elasticHue = new Elastic(parameters.hue, numFrames)
let elasticSaturation = new Elastic(parameters.saturation, numFrames)
let elasticHeight = new Elastic(parameters.height, numFrames)
let elasticGlow = new Elastic(parameters.glow, numFrames)
let elasticWhite = new Elastic(parameters.white, numFrames)

mesh.material.transparent = true

let animate = function() {
  requestAnimationFrame(animate)
  if (playing) {
    shaderMaterial.uniforms.interpolation.value =
      1 - recorded[playingFrame].white
    time += recorded[playingFrame].motionSpeed
    shaderMaterial.uniforms.opacity.value = recorded[playingFrame].opacity
    shaderMaterial.uniforms.hue.value = recorded[playingFrame].hue
    shaderMaterial.uniforms.saturation.value = recorded[playingFrame].saturation
    shaderMaterial.uniforms.height.value = recorded[playingFrame].height
    bloomPass.strength = recorded[playingFrame].glow
    playingFrame++
    if (playingFrame >= recorded.length) parameters.stop()
  } else {
    shaderMaterial.uniforms.interpolation.value =
      1 - elasticWhite.next(parameters.white)
    time += parameters.motionSpeed
    shaderMaterial.uniforms.opacity.value = elasticOpacity.next(
      parameters.opacity
    )
    shaderMaterial.uniforms.hue.value = elasticHue.next(parameters.hue)
    shaderMaterial.uniforms.saturation.value = elasticSaturation.next(
      parameters.saturation
    )
    shaderMaterial.uniforms.height.value = elasticHeight.next(parameters.height)
    bloomPass.strength = elasticGlow.next(parameters.glow)
    if (recording) {
      recorded.push({
        motionSpeed: parameters.motionSpeed,
        saturation: elasticSaturation.value,
        hue: elasticHue.value,
        height: elasticHeight.value,
        glow: elasticGlow.value,
        opacity: elasticOpacity.value,
        white: elasticWhite.value
      })
    }
  }
  mesh.rotation.y += parameters.rotationSpeed / 100
  shaderMaterial.uniforms.time.value = time / 100
  shaderMaterial.uniforms.detail.value = parameters.detail
  shaderMaterial.uniforms.feedback.value = parameters.feedback
  composer.render()
}
animate()
