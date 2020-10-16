import * as THREE from 'three'
import Tone from 'tone'
import vert from './glsl/shader.vert'
import frag from './glsl/shader.frag'

const renderer = new THREE.WebGLRenderer({ antialias: false })

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let scene = new THREE.Scene()
scene.background = new THREE.Color(0x036b59)

let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.y = -4
camera.position.z = 5
camera.lookAt(0, -0.5, 0)

let pads = []

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    t: { type: 'f', value: 0 },
  },
  vertexShader: vert,
  fragmentShader: frag,
})

for (let i = 0; i < 16; i++) {
  let geometry = new THREE.PlaneGeometry(3, 3, 10, 10)
  let wireframe = new THREE.WireframeGeometry(geometry)
  let plane = new THREE.LineSegments(wireframe, shaderMaterial)
  plane.position.set((i % 4) * 2 - 3, Math.floor(i / 4) * 2 - 3, 0)
  plane.scale.set(0.01, 0.01, 0.01)
  scene.add(plane)
  pads.push(plane)
}
/*
import png from '../textures/014.png'
let texture = new three.textureloader().load(png)
texture.magfilter = three.nearestfilter
var pngGeometry = new THREE.PlaneGeometry(10, 10)
let pngMaterial = new THREE.MeshBasicMaterial({ map: texture })
let plane = new THREE.Mesh(pngGeometry, pngMaterial)
scene.add(plane)
*/

const animate = () => {
  requestAnimationFrame(animate)
  shaderMaterial.uniforms.t.value++
  renderer.render(scene, camera)
}

animate()

//~~~
function scaleGenerator(pattern) {
  const partialSums = pattern.reduce(
    (arr, val) => [...arr, arr[arr.length - 1] + val],
    [0]
  )

  const totalSum = partialSums[partialSums.length - 1]

  const scale = (index) => {
    const course = Math.floor(index / pattern.length) * totalSum
    const fine = partialSums[index % pattern.length]
    return course + fine
  }

  return scale
}

const scale = scaleGenerator([3, 2, 2, 3, 2])

Tone.context.lookAhead = 0

let voices = []
let gain = new Tone.Gain(0.1).toMaster()

for (let i = 0; i < 16; i++) {
  let oscGain = new Tone.Gain(0.0).connect(gain)
  let osc1 = new Tone.Oscillator(
    Tone.Frequency.mtof(scale(i + 3) + 40),
    'sawtooth'
  ).connect(oscGain)
  let osc2 = new Tone.Oscillator(
    Tone.Frequency.mtof(scale(i) + 40),
    'square'
  ).connect(oscGain)
  voices.push({ osc1, osc2, oscGain })
}

const keyDown = (e) => {
  Tone.context.resume().then(() => {
    for (let i = 0; i < 16; i++) {
      voices[i].osc1.start()
      voices[i].osc2.start()
    }
    console.log('Started')
  })
}

window.addEventListener('keydown', keyDown)

//~~~

let midiIn = []
let midiOut = []

function connect() {
  navigator.requestMIDIAccess().then(
    (midi) => midiReady(midi),
    (err) => console.log('Something went wrong', err)
  )
}

function midiReady(midi) {
  midi.addEventListener('statechange', (event) => initDevices(event.target))
  initDevices(midi) // see the next section!
}

function initDevices(midi) {
  midiIn = []
  midiOut = []

  // MIDI devices that send you data.
  const inputs = midi.inputs.values()
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiIn.push(input.value)
  }

  // MIDI devices that you send data to.
  const outputs = midi.outputs.values()
  for (
    let output = outputs.next();
    output && !output.done;
    output = outputs.next()
  ) {
    midiOut.push(output.value)
  }
  startListening()
}

// Start listening to MIDI messages.
function startListening() {
  for (const input of midiIn) {
    input.addEventListener('midimessage', midiMessageReceived)
  }
}

function midiMessageReceived(event) {
  // MIDI commands we care about. See
  // http://webaudio.github.io/web-midi-api/#a-simple-monophonic-sine-wave-midi-synthesizer.
  const NOTE_ON = 9
  const NOTE_OFF = 8
  const NOTE_AFT = 10

  const cmd = event.data[0] >> 4
  const note = event.data[1] - 36
  const value = event.data[2] / 127

  switch (cmd) {
    case NOTE_AFT:
      pads[note].scale.set(
        (value * 4) / 5 + 0.01,
        (value * 4) / 5 + 0.01,
        (value * 4) / 5 + 0.01
      )
      voices[note].oscGain.gain.linearRampTo(value * 0.9, 0.01)
      break
    case NOTE_ON:
      pads[note].scale.set(
        (value * 4) / 5 + 0.01,
        (value * 4) / 5 + 0.01,
        (value * 4) / 5 + 0.01
      )
      voices[note].oscGain.gain.linearRampTo(value * 0.9, 0.01)
      break
    case NOTE_OFF:
      pads[note].scale.set(0.01, 0.01, 0.01)
      voices[note].oscGain.gain.linearRampTo(0, 0.2)
  }
  /*
  // Note that not all MIDI controllers send a separate NOTE_OFF command for every NOTE_ON.
  if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
    console.log(
      `🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: ${velocity}`
    )

    // Complete the note!
    const note = notesOn.get(pitch)
    if (note) {
      console.log(`🎵 pitch:${pitch}, duration:${timestamp - note} ms.`)
      notesOn.delete(pitch)
    }
  } else if (cmd === NOTE_ON) {
    console.log(
      `🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: {velocity}`
    )

    // One note can only be on at once.
    notesOn.set(pitch, timestamp)
  }
  */
}

connect()
