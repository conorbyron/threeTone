import * as THREE from 'three'
import * as Tone from 'tone'
import vertexShader from './glsl/fluid.vert'
import fragmentShader from './glsl/fluid.frag'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as dat from 'dat.gui'

const gui = new dat.GUI()

// need: detail of sin function (texture), speed, colour saturation, colour channel mixes, ...
let parameters = {
  detail: 6,
  feedback: 10,
  height: 2,
  rotationSpeed: 0.3,
  volume: 1.0,
}
gui.add(parameters, 'rotationSpeed', -5, 5).step(0.1)
gui.add(parameters, 'volume', 0, 1).step(0.01)

let recievingValues = false

let waves = []

const webSocket = new WebSocket('ws://localhost:3000')
webSocket.onmessage = function (event) {
  const message = JSON.parse(event.data)
  waves[message.wave] = message.currentValues
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
    saturation: { type: 'f', value: 0 },
    interpolation: { type: 'f', value: 1 },
    opacity: { type: 'f', value: 0.5 },
  },
  vertexShader,
  fragmentShader,
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

let lineZoom = {
  startVal: 300,
  endVal: 25,
  duration: 20,
  startTime: null,
  elapsedTime: 0,
  complete: false,
  update: function () {
    if (this.complete) return this.complete
    if (this.startTime) {
      this.elapsedTime = (Date.now() - this.startTime) / 1000
      this.complete = this.elapsedTime >= this.duration
      return this.complete
    } else {
      this.startTime = Date.now()
    }
    return false
  },
  get value() {
    return (
      this.startVal +
      ((this.endVal - this.startVal) * this.elapsedTime) / this.duration
    )
  },
}

let opacityLine = {
  offVal: 0,
  onVal: 1,
  duration: 4,
  increment: 1 / 120,
  value: 0,
  update: function (on) {
    if (on && this.value < this.onVal) {
      this.value += this.increment
    } else if (!on && this.value > this.offVal) {
      this.value -= this.increment
    }
  },
}

let lineWhiteFade = {
  startVal: 0,
  endVal: 1,
  duration: 6,
  startTime: null,
  elapsedTime: 0,
  complete: false,
  update: function () {
    if (this.complete) return this.complete
    if (this.startTime) {
      this.elapsedTime = (Date.now() - this.startTime) / 1000
      this.complete = this.elapsedTime >= this.duration
      return this.complete
    } else {
      this.startTime = Date.now()
    }
    return false
  },
  get value() {
    return (
      this.startVal +
      ((this.endVal - this.startVal) * this.elapsedTime) / this.duration
    )
  },
}
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

mesh.material.transparent = true

let animate = function () {
  requestAnimationFrame(animate)
  const { alpha, beta, delta, gamma, theta } = waves
  //if (!lineZoom.update()) camera.position.z = lineZoom.value
  if (alpha.zeros > 0) {
    if (recievingValues) {
      recievingValues = false
    }
  } else {
    if (!recievingValues) {
      recievingValues = true
      lineWhiteFade.startTime = null
      lineWhiteFade.elapsedTime = 0
      lineWhiteFade.complete = false
    }
  }
  if (!lineWhiteFade.update()) {
    shaderMaterial.uniforms.interpolation.value = lineWhiteFade.value
    renderer.toneMappingExposure = 4 - 3 * lineWhiteFade.value
  }
  opacityLine.update(recievingValues)
  mesh.rotation.y += parameters.rotationSpeed / 100
  // this stuff should definitely be part of the buffer class
  time += 1 - alpha.value
  shaderMaterial.uniforms.time.value = time / 100
  shaderMaterial.uniforms.opacity.value = opacityLine.value
  shaderMaterial.uniforms.hue.value = 0.7 - 0.7 * beta.value
  shaderMaterial.uniforms.saturation.value = theta.value
  shaderMaterial.uniforms.height.value = parameters.height * delta.value
  bloomPass.strength = 0.5 * gamma.value
  shaderMaterial.uniforms.detail.value = parameters.detail
  shaderMaterial.uniforms.feedback.value = parameters.feedback
  composer.render()
}

class BeeThree {
  constructor() {
    this.multC = new Tone.Multiply(0.25)

    this.osc1b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc2b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc3b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc4b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )

    this.add1 = new Tone.Add(0).connect(this.osc1b.frequency)
    this.add2 = new Tone.Add(0).connect(this.osc2b.frequency)
    this.add3 = new Tone.Add(0).connect(this.osc3b.frequency)
    this.add4 = new Tone.Add(0).connect(this.osc4b.frequency)

    this.mult1b = new Tone.Multiply(0).connect(this.add1.addend)
    this.mult2b = new Tone.Multiply(0).connect(this.add2.addend)
    this.mult3b = new Tone.Multiply(0).connect(this.add3.addend)
    this.mult4b = new Tone.Multiply(0).connect(this.add4.addend)

    this.osc1a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult1b
    )
    this.osc2a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult2b
    )
    this.osc3a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult3b
    )

    let vals = new Float32Array(44100)
    for (let i = 0; i < vals.length; i++) {
      let pos = i / vals.length
      if (pos <= 0.5) {
        const { abs, sin, PI } = Math
        vals[pos] = abs(sin(PI * pos * 4))
      } else {
        vals[pos] = 0.0
      }
    }
    let buffer = Tone.Buffer.fromArray(vals)
    this.fwavblnk = new Tone.BufferSource(buffer)
    this.fwavblnk.loop = true
    //this.fwavblnk.playbackRate = 6.009 * 440
    this.fwavblnk.connect(this.mult4b.input)

    this.mult1a = new Tone.Multiply(0.999)
      .connect(this.osc1a.frequency)
      .connect(this.mult1b.factor)
    this.mult2a = new Tone.Multiply(1.997)
      .connect(this.osc2a.frequency)
      .connect(this.mult2b.factor)
    this.mult3a = new Tone.Multiply(3.006)
      .connect(this.osc3a.frequency)
      .connect(this.mult3b.factor)
    this.mult4a = new Tone.Multiply(6.009).connect(this.mult4b.factor)

    this.frequency = new Tone.Signal({ value: 440, units: 'frequency' })
      .connect(this.mult1a)
      .connect(this.mult2a)
      .connect(this.mult3a)
      .connect(this.mult4a)

    Tone.Transport.scheduleRepeat(() => {
      this.fwavblnk.playbackRate = this.frequency.value
    }, '0.1')
  }

  start() {
    this.osc1a.start()
    this.osc2a.start()
    this.osc3a.start()
    this.fwavblnk.start()
    this.osc1b.start()
    this.osc2b.start()
    this.osc3b.start()
    this.osc4b.start()
  }

  connect(node) {
    this.multC.connect(node)
  }
}
// ~~~

const reverbCrossFade = new Tone.CrossFade(0).toDestination()
const reverb = new Tone.JCReverb(0.5).connect(reverbCrossFade.b)
const totalGain = new Tone.Gain(0).connect(reverb).connect(reverbCrossFade.a)

// ~~~

const bee3Gain = new Tone.Gain(0).connect(totalGain)
const highpass = new Tone.BiquadFilter(1500, 'highpass').connect(bee3Gain)
const bee3a = new BeeThree()
const bee3b = new BeeThree()
const mult = new Tone.Multiply(0.5 + Math.random()).connect(bee3b.frequency)
bee3a.frequency.connect(mult)

bee3a.connect(highpass)
bee3b.connect(highpass)

Tone.Transport.scheduleRepeat(() => {
  bee3a.frequency.linearRampTo(50 + Math.random() * 100, '1000')
  mult.factor.linearRampTo(0.5 + Math.random(), '1000')
}, '1000')

// ~~~

const noiseGain = new Tone.Gain(0).connect(totalGain)
const lowpass = new Tone.BiquadFilter(1500, 'lowpass').connect(noiseGain)
const noiseCrossFade = new Tone.CrossFade(1).connect(lowpass.frequency)
const noise = new Tone.Noise('pink').connect(lowpass)
const lfo = new Tone.LFO('0.1', 500, 1500).connect(noiseCrossFade.a)
const randSig = new Tone.Signal(500, 'frequency').connect(noiseCrossFade.b)

Tone.Transport.scheduleRepeat(() => {
  randSig.linearRampTo(500 + Math.random() * 1500, '4')
}, '4')

// ~~~

Tone.Transport.scheduleRepeat(() => {
  const { alpha, beta, delta, gamma, theta } = waves
  // wave 1
  noiseGain.gain.linearRampTo(1 - alpha.value, '0.25')
  // wave 2
  noiseCrossFade.fade.linearRampTo(delta.value * 0.5, '0.25')
  // wave 3
  highpass.frequency.linearRampTo(beta.value * 2000, '0.25')
  // wave 4
  bee3Gain.gain.linearRampTo(theta.value * 0.4, '0.25')
  // wave 5
  if (recievingValues) {
    totalGain.gain.linearRampTo(
      (0.6 - gamma.value * 0.3) * parameters.volume,
      '0.25'
    )
  } else {
    totalGain.gain.linearRampTo(0, '0.25')
  }
  reverbCrossFade.fade.linearRampTo(gamma.value, '0.25')
}, '0.25')

let contextStarted = false
const keyDown = (e) => {
  if (!contextStarted) {
    Tone.context.resume().then(() => {
      bee3a.start()
      bee3b.start()
      noise.start()
      lfo.start()
      Tone.Transport.start()
      contextStarted = true
    })
  }
}

window.addEventListener('keydown', keyDown)

animate()
