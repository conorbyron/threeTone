import * as THREE from 'three'
import Tone from 'tone'

let listening = false

let mic = new Tone.UserMedia()
let analyser = new Tone.Analyser()
let fftArray

//opening the input asks the user to activate their mic
mic.open().then(function () {
  mic.connect(analyser)
  listening = true
})

let width = window.innerWidth
let height = window.innerHeight
let scene = new THREE.Scene()

let camera = new THREE.OrthographicCamera(
  width / -64,
  width / 64,
  height / 64,
  height / -64,
  -10000,
  10000
)

let renderer = new THREE.WebGLRenderer({})
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

let v = []
let n = analyser.size

for (let i = 0; i < n; i++) {
  let x = -width / 64 + ((i / (n - 1)) * width) / 32
  v.push(x, 0, 0)
}

let vertices = new Float32Array(v)

let geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
let material = new THREE.LineBasicMaterial({ color: 0xffffff })
let line = new THREE.Line(geometry, material)

scene.add(line)

let animate = function () {
  requestAnimationFrame(animate)
  if (listening) {
    fftArray = analyser.getValue()
    console.log(fftArray)
    for (let i = 0; i < analyser.size; i += 1) {
      vertices[i * 3 + 1] = (fftArray[i] + 100) / 10
    }
    line.geometry.attributes.position.needsUpdate = true
  }
  renderer.render(scene, camera)
}

animate()
