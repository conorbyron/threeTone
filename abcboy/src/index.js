import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js'
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js'

let width = window.innerWidth
let height = window.innerHeight

let bgScene = new THREE.Scene()
let scene = new THREE.Scene()
let camera = new THREE.OrthographicCamera(
  width / -64,
  width / 64,
  height / 64,
  height / -64,
  -10000,
  10000
)

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const renderTargetParams = {
  stencilBuffer: false,
  depthBuffer: false,
}

let bgBuffer = new THREE.WebGLRenderTarget(width, height, renderTargetParams)

let planeGeo = new THREE.PlaneGeometry(1, 1, 100, 100)

let mapPlaneGeo = new THREE.PlaneGeometry(width / 32, height / 32)

let bgMaterial = new THREE.MeshLambertMaterial({ color: 0xc1c3c5 })
let bgMesh = new THREE.Mesh(planeGeo, bgMaterial)
bgMesh.scale.set(width / 32, height / 16, 1)

let mapMaterial = new THREE.MeshBasicMaterial({ map: bgBuffer.texture })
let mapMesh = new THREE.Mesh(mapPlaneGeo, mapMaterial)
mapMesh.position.z = -5

let geometry = new THREE.SphereGeometry(8, 100, 100)
let material = new THREE.MeshLambertMaterial({ color: 0xc1c3c5 })
let orb = new THREE.Mesh(geometry, material)
orb.position.z = 0

let lightZ = 30
let pointLight = new THREE.PointLight(0xffffff, 0.3)
pointLight.position.z = lightZ
pointLight.decay = 5

let bgLightZ = 4.5
let bgPointLight = new THREE.PointLight(0xffffff, 2.8)
bgPointLight.position.set(1, 0.75, bgLightZ)
bgPointLight.decay = 0

let ambientLight = new THREE.AmbientLight(0xd35481, 0.9)

//let lightRing = new THREE.Group()

let mousePos = new THREE.Vector3(15, 15, 0)

/*
let radius = 50
let max = 9
for (let i = 0; i < max; i++) {
  let x = radius * Math.sin((2 * Math.PI * i) / max)
  let y = radius * Math.cos((2 * Math.PI * i) / max)
  let light = new THREE.PointLight(0xffffff, 0.12)
  light.position.set(x, y, 0)
  lightRing.add(light)
}

lightRing.position.set(40, -15, 0)
scene.add(lightRing)
*/

bgScene.add(bgMesh)
scene.add(mapMesh)
scene.add(orb)
bgScene.add(bgPointLight)
scene.add(pointLight)
scene.add(ambientLight)
//bgScene.add(bgAmbientLight)

function onWindowResize() {
  width = window.innerWidth
  height = window.innerHeight
  camera.left = width / -64
  camera.right = width / 64
  camera.top = height / 64
  camera.bottom = height / -64
  camera.updateProjectionMatrix()
  bgMesh.scale.set(width / 32, height / 16, 1)
  mapMaterial.needsUpdate = true
  mapPlaneGeo = new THREE.PlaneGeometry(width / 32, height / 32)
  scene.remove(mapMesh)
  mapMesh = new THREE.Mesh(mapPlaneGeo, mapMaterial)
  mapMesh.position.z = -5
  scene.add(mapMesh)
  composer.setSize(width, height)
  renderer.setSize(width, height)
}

window.addEventListener('resize', onWindowResize, false)
window.addEventListener(
  'pointermove',
  (e) => {
    mousePos.set(
      e.pageX / 64 - width / (64 * 2),
      -e.pageY / 64 + height / (64 * 2),
      0
    )
  },
  false
)

function scroll(x) {
  let i = x < 1 ? x : 1

  pointLight.position.x = 0
  pointLight.position.y = 0
  pointLight.position.z = 0

  bgPointLight.position.x = 0
  bgPointLight.position.y = 0
  bgPointLight.position.z = 0

  orb.position.x = 0
  orb.position.y = 0
  orb.position.z = 0
}

function ease(x) {
  return Math.sqrt(1 - Math.pow(x - 1, 2))
}

let hBlur = new ShaderPass(HorizontalBlurShader)
hBlur.uniforms.h.value = 0.5 / window.innerHeight

let vBlur = new ShaderPass(VerticalBlurShader)
vBlur.uniforms.v.value = 1 / window.innerWidth

let fgRender = new RenderPass(scene, camera)
fgRender.clear = false
fgRender.clearDepth = true

let composer = new EffectComposer(renderer)
composer.addPass(fgRender)
composer.addPass(hBlur)
composer.addPass(vBlur)

let animate = function () {
  requestAnimationFrame(animate)
  pointLight.position.x = mousePos.x * 2
  pointLight.position.y = mousePos.y * 2
  let distanceToCentre = mousePos.length()
  if (distanceToCentre < 5)
    pointLight.intensity = 0.6 * (distanceToCentre / 5) + 0.2
  else pointLight.intensity = 0.8
  renderer.setRenderTarget(bgBuffer)
  renderer.render(bgScene, camera)
  composer.render()
}
animate()
