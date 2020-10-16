import * as THREE from 'three'
import scatterVert from './glsl/scatter.vert'
import scatterFrag from './glsl/scatter.frag'
import backgroundVert from './glsl/background.vert'
import backgroundFrag from './glsl/background.frag'
import foregroundVert from './glsl/foreground.vert'
import foregroundFrag from './glsl/foreground.frag'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

let width = window.innerWidth
let height = window.innerHeight
let scatterScene = new THREE.Scene()

let scatterCamera = new THREE.OrthographicCamera(
  width / -64,
  width / 64,
  height / 64,
  height / -64,
  -10000,
  10000
)

let renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

let scatterVertices = []
let scatterIndices = []

let index = 0

for (let i = 0; i < 1500; i++) {
  scatterIndices.push(index)
  scatterVertices.push(
    (Math.random() * width - width / 2) / 32,
    (Math.random() * height - height / 2) / 32,
    0
  )
  index++
}

const scatterVertexBuffer = new Float32Array(scatterVertices)
const scatterIndexBuffer = new Float32Array(scatterIndices)

let scatterGeometry = new THREE.BufferGeometry()
scatterGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(scatterVertexBuffer, 3)
)
scatterGeometry.setAttribute(
  'index',
  new THREE.BufferAttribute(scatterIndexBuffer, 1)
)

const renderTargetParams = {
  stencilBuffer: false,
  depthBuffer: false,
}

let nextBuffer = new THREE.WebGLRenderTarget(width, height, renderTargetParams)
let prevBuffer = new THREE.WebGLRenderTarget(width, height, renderTargetParams)

let scatterBackground = new THREE.MeshBasicMaterial({
  map: prevBuffer.texture,
})

let scatterMaterial = new THREE.ShaderMaterial({
  uniforms: {
    p: { type: 'f', value: 0 },
    resolution: {
      type: 'v2',
      value: new THREE.Vector2(
        renderer.domElement.width,
        renderer.domElement.height
      ),
    },
  },
  vertexShader: scatterVert,
  fragmentShader: scatterFrag,
})

let planeGeometry = new THREE.PlaneGeometry(width / 32, height / 32)
let backPlane = new THREE.Mesh(planeGeometry, scatterBackground)
backPlane.position.z = -1

let scatter = new THREE.Points(scatterGeometry, scatterMaterial)

scatterScene.add(backPlane)
scatterScene.add(scatter)

scatterCamera.position.z = 2

const scale = 15
const radius = 1
const centreOffset = (radius * (scale - 1.0)) / 2.0
let p = 0
let scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

let camera = new THREE.OrthographicCamera(
  width / -64,
  width / 64,
  height / 64,
  height / -64,
  -10000,
  10000
)

let controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false
controls.autoRotate = true
controls.autoRotateSpeed = 0.25

camera.position.copy(
  new THREE.Vector3(Math.random(), Math.random(), Math.random())
    .normalize()
    .multiplyScalar(5)
)
camera.lookAt(0, 0, 0)

camera.zoom = 1.5 + Math.random() * 0.8
camera.updateProjectionMatrix()

let vertices = []
let indices = []
index = 0

for (let i = 0; i < scale; i++) {
  for (let j = 0; j < scale; j++) {
    for (let k = 0; k < scale; k++) {
      indices.push(index)
      index++
      vertices.push(
        ...[
          radius * i - centreOffset,
          radius * j - centreOffset,
          radius * k - centreOffset,
        ]
      )
    }
  }
}

const vertexBuffer = new Float32Array(vertices)
const indexBuffer = new Float32Array(indices)

let geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(vertexBuffer, 3))
geometry.setAttribute('index', new THREE.BufferAttribute(indexBuffer, 1))

let backgroundShader = new THREE.ShaderMaterial({
  uniforms: {
    colors: { type: 't', value: nextBuffer.texture },
    p: { type: 'f', value: 0 },
    resolution: {
      type: 'v2',
      value: new THREE.Vector2(
        renderer.domElement.width,
        renderer.domElement.height
      ),
    },
  },
  vertexShader: backgroundVert,
  fragmentShader: backgroundFrag,
})

let foregroundShader = new THREE.ShaderMaterial({
  uniforms: {
    p: { type: 'f', value: 0 },
    resolution: {
      type: 'v2',
      value: new THREE.Vector2(
        renderer.domElement.width,
        renderer.domElement.height
      ),
    },
  },
  vertexShader: foregroundVert,
  fragmentShader: foregroundFrag,
})

let background = new THREE.Points(geometry, backgroundShader)
let foreground = new THREE.Points(geometry, foregroundShader)
scene.add(background)
scene.add(foreground)

camera.position.z = 2

let renderScene = new RenderPass(scene, camera)

let bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  3.0,
  0.0,
  0.0
)

let composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

let pointerDown = false
let rotationTimeout = 0

window.addEventListener('resize', onWindowResize, false)
window.addEventListener(
  'pointerdown',
  (e) => {
    pointerDown = true
  },
  false
)
window.addEventListener(
  'pointerup',
  (e) => {
    pointerDown = false
  },
  false
)
window.addEventListener(
  'pointermove',
  (e) => {
    if (pointerDown) {
      rotationTimeout = 2
      controls.autoRotate = false
    }
  },
  false
)

function onWindowResize() {
  width = window.innerWidth
  height = window.innerHeight
  camera.left = width / -64
  camera.right = width / 64
  camera.top = height / 64
  camera.bottom = height / -64
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

let animate = function () {
  requestAnimationFrame(animate)

  if (rotationTimeout > 0) {
    rotationTimeout -= 1 / 60
    if (rotationTimeout <= 0) {
      rotationTimeout = 0
      controls.autoRotate = true
    }
  }

  for (let i = 0; i < scatterVertexBuffer.length; i += 3) {
    scatterVertexBuffer[i] = (Math.random() * width - width / 2) / 32
    scatterVertexBuffer[i + 1] = (Math.random() * height - height / 2) / 32
  }
  scatter.geometry.attributes.position.needsUpdate = true

  const tempBuffer = prevBuffer
  prevBuffer = nextBuffer
  nextBuffer = tempBuffer

  scatterBackground.map = prevBuffer.texture
  scatterBackground.needsUpdate = true

  renderer.setRenderTarget(nextBuffer)
  renderer.render(scatterScene, scatterCamera)

  p += 0.05

  backgroundShader.uniforms.colors.value = nextBuffer.texture
  backgroundShader.uniforms.p.value = p
  foregroundShader.uniforms.p.value = p
  controls.update()
  composer.render()
}

animate()
