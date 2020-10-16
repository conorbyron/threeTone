import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let renderer = new THREE.WebGLRenderer({
  antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const blue = new THREE.Color(0x4444ee)
const violet = new THREE.Color(0x3f00ff)
const gold = new THREE.Color(0x8877e2)
const orange = new THREE.Color(0xebb63c)
const red = new THREE.Color(0xff0000)

let scene = new THREE.Scene()
scene.background = orange
let camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  -1000,
  1000
)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false

camera.position.z = 5

const unit = window.innerWidth / 4
let geometry = new THREE.BoxGeometry(unit, unit, unit)
let edges = new THREE.EdgesGeometry(geometry)
let cube = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({ color: red })
)
scene.add(cube)

const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
