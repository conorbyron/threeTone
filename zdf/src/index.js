import * as THREE from 'three'
//import Tone from 'tone';

/*
Create elements in the scene and animate them with more than constant, universally applied functions.

Two ways this could be accomplished:
- The properties of the elements are updated based on their relation to other elements in the scene.
eg. gravitation, dependent on relative position.
- The properties of the objects are updated based on a given sequence over time.
*/

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

  high(n) {
    const highest = this.buffer
      .concat()
      .sort((a, b) => a - b)
      .slice(this.buffer.length - n)
      .reduce((a, b) => a + b, 0)
    return highest / n
  }
}

let audioContext
let mediaStreamSource = null
let meter = null

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.z = 10

var geometry = new THREE.PlaneGeometry(4, 4)
let material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
let plane1 = new THREE.Mesh(geometry, material)
plane1.position.x -= 6
scene.add(plane1)

material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
let plane2 = new THREE.Mesh(geometry, material)
scene.add(plane2)

material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
let plane3 = new THREE.Mesh(geometry, material)
plane3.position.x += 6
scene.add(plane3)

geometry = new THREE.PlaneGeometry(4, 0.5)
material = new THREE.MeshBasicMaterial({ color: 0x000000 })
let plane4 = new THREE.Mesh(geometry, material)
plane4.position.y += 2.5
//scene.add(plane4)

material = new THREE.MeshBasicMaterial({ color: 0x000000 })
let plane5 = new THREE.Mesh(geometry, material)
plane5.position.x += 6
plane5.position.y += 2.5
//scene.add(plane5)

let ambient = new CircularBuffer(500, 1.0)
let current = new CircularBuffer(20, 0.5)

const animate = () => {
  requestAnimationFrame(animate)
  let currentMean = current.mean()
  let ambientMean = ambient.mean()
  let ambientHigh = ambient.high(40)
  plane1.material.color.setHSL(currentMean, 1.0, 0.5)
  if (currentMean > ambientMean) plane2.material.color.setHex(0x0000ff)
  if (currentMean > ambientHigh) plane3.material.color.setHex(0x0000ff)
  renderer.render(scene, camera)
}

renderer.clearColor()
const keyDown = e => {
  if (!audioContext) beginDetect()
}

window.addEventListener('keydown', keyDown)

function beginDetect() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaStreamSource = audioContext.createMediaStreamSource(stream)
      meter = createAudioMeter(audioContext)
      mediaStreamSource.connect(meter)
    })
    setTimeout(() => {
      animate()
    }, 2000)
  }
}

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
  const processor = audioContext.createScriptProcessor(512)
  processor.onaudioprocess = volumeAudioProcess
  processor.clipping = false
  processor.lastClip = 0
  processor.volume = 0
  processor.clipLevel = clipLevel || 0.98
  processor.averaging = averaging || 0.95
  processor.clipLag = clipLag || 750

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination)

  processor.checkClipping = function() {
    if (!this.clipping) {
      return false
    }
    if (this.lastClip + this.clipLag < window.performance.now()) {
      this.clipping = false
    }
    return this.clipping
  }

  processor.shutdown = function() {
    this.disconnect()
    this.onaudioprocess = null
  }
  return processor
}

function volumeAudioProcess(event) {
  const buf = event.inputBuffer.getChannelData(0)
  const bufLength = buf.length
  let sum = 0
  let x

  for (var i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true
      this.lastClip = window.performance.now()
    }
    sum += x * x
  }
  const rms = Math.sqrt(sum / bufLength)

  this.volume = Math.max(rms, this.volume * this.averaging)

  // This can all be transferred to webassembly.
  // I need to come up with a better system for determining and working within hi and lo rms values.
  // What is this.averaging, and can I use it to set hi and lo?

  let val = this.volume / 0.5
  //val += 0.1;
  if (val > 0.85) {
    val = 0.85
  }
  ambient.push(val)
  current.push(val)
}
