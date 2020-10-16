import * as THREE from 'three'
import scatterVert from './glsl/scatter.vert'
import scatterFrag from './glsl/scatter.frag'

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

let renderer = new THREE.WebGLRenderer({})
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

let scatterVertices = []
let scatterIndices = []

let index = 0

for (let i = 0; i < 500; i++) {
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

let backgroundGeometry = new THREE.PlaneGeometry(width / 32, height / 32)
let background = new THREE.Mesh(backgroundGeometry, scatterBackground)
background.position.z = -1

let scatter = new THREE.Points(scatterGeometry, scatterMaterial)

scatterScene.add(background)
scatterScene.add(scatter)

scatterCamera.position.z = 2

let animate = function () {
  requestAnimationFrame(animate)
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
  renderer.setRenderTarget(null)
  renderer.render(scatterScene, scatterCamera)
}

animate()
