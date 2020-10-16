import * as THREE from 'three'
import Tone from 'tone'
import vert from './glsl/shader.vert'
import frag from './glsl/shader.frag'

const pngs = ((r) =>
  r
    .keys()
    .map(r)
    .map((e) => e.default))(require.context('../textures', false, /\.(png)$/))

const groupings = [[0, 4], [1, 9], [2, 5, 8, 10], [3], [6, 12], [7, 11]]

const renderer = new THREE.WebGLRenderer({ antialias: false })

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

let scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

let camera = new THREE.OrthographicCamera(
  window.innerWidth / -256,
  window.innerWidth / 256,
  window.innerHeight / 256,
  window.innerHeight / -256,
  -10000,
  10000
)

camera.position.z = 6

let pads = []

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    t: { type: 'f', value: 0 },
  },
  vertexShader: vert,
  fragmentShader: frag,
})

/*
for (let i = 0; i < 16; i++) {
  let geometry = new THREE.PlaneGeometry(3, 3, 10, 10)
  let wireframe = new THREE.WireframeGeometry(geometry)
  let plane = new THREE.LineSegments(wireframe, shaderMaterial)
  plane.position.set((i % 4) * 2 - 3, Math.floor(i / 4) * 2 - 3, 0)
  plane.scale.set(0.01, 0.01, 0.01)
  scene.add(plane)
  pads.push(plane)
}
*/

let textures = []
pngs.forEach((png, i) => {
  let texture = new THREE.TextureLoader().load(png)
  texture.anisotropy = 0
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  var pngGeometry = new THREE.PlaneGeometry(10, 10)
  let pngMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  })
  let plane = new THREE.Mesh(pngGeometry, pngMaterial)
  plane.position.z = i / 10
  plane.material.opacity = 1
  textures.push(plane)
  scene.add(plane)
})

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

const scale = scaleGenerator([2, 3, 2, 2, 3])

Tone.context.lookAhead = 0

let voices = []
let gain = new Tone.Gain(0.1).toMaster()

for (let i = 0; i < 16; i++) {
  let oscGain = new Tone.Gain(0.0).connect(gain)
  let osc1 = new Tone.Oscillator(
    Tone.Frequency.mtof(scale(i + 2) + 40),
    'sawtooth'
  ).connect(oscGain)
  let osc2 = new Tone.Oscillator(
    Tone.Frequency.mtof(scale(i) + 40),
    'triangle'
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
  const NOTE_ON = 9
  const NOTE_OFF = 8
  const NOTE_AFT = 10

  const cmd = event.data[0] >> 4
  const note = event.data[1] - 36
  const value = event.data[2] / 127

  switch (cmd) {
    case NOTE_AFT:
      groupings[note - 4].forEach((layer) => {
        textures[layer].material.opacity = value
      })
      voices[note].oscGain.gain.linearRampTo(value * 0.9, 0.01)
      break
    case NOTE_ON:
      groupings[note - 4].forEach((layer) => {
        textures[layer].material.opacity = value
      })
      voices[note].oscGain.gain.linearRampTo(value * 0.9, 0.01)
      break
    case NOTE_OFF:
      groupings[note - 4].forEach((layer) => {
        textures[layer].material.opacity = 0
      })
      voices[note].oscGain.gain.linearRampTo(0, 0.2)
  }
}

connect()
