import * as THREE from 'three'
import { Dot, Renderer } from './sceneObjects'
import dotsVert from './glsl/dots.vert'
import dotsFrag from './glsl/dots.frag'
import * as dat from 'dat.gui'

const gui = new dat.GUI()

let parameters = {
  maximum: 7,
  size: 30
}

gui.add(parameters, 'maximum', 1, 50).step(1)
gui.add(parameters, 'size', 0.5, 40).step(0.5)

let grid = []
const scale = 53
const radius = 4
const centreOffset = (radius * (scale - 1.0)) / 2.0
let p = 0
let render = new Renderer()

let vertices = []
let indices = []
let index = 0

for (let i = 0; i < scale; i++) {
  for (let j = 0; j < scale; j++) {
    for (let k = 0; k < scale; k++) {
      indices.push(index)
      index++
      vertices.push(
        ...[
          radius * i - centreOffset,
          radius * j - centreOffset,
          radius * k - centreOffset
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

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    //factor: { type: "f", value: 0.05 },
    //hue: { type: "f", value: 0.0 },
    maximum: { type: 'f', value: parameters.maximum },
    size: { type: 'f', value: parameters.size },
    p: { type: 'f', value: 0 },
    resolution: {
      type: 'v2',
      value: new THREE.Vector2(
        render.renderer.domElement.width,
        render.renderer.domElement.height
      )
    }
    //texResolution: { type: "v2", value: new THREE.Vector2(drawingWidth, drawingHeight) },
    //paint: { type: "t", value: targetB.texture },
  },
  vertexShader: dotsVert,
  fragmentShader: dotsFrag
})

let pointCloud = new THREE.Points(geometry, shaderMaterial)
render.scene.add(pointCloud)

let cube = new THREE.Mesh(
  new THREE.BoxGeometry(
    scale * radius + 10,
    scale * radius + 10,
    scale * radius + 10
  ),
  new THREE.MeshBasicMaterial({ color: 0xeeeeee })
)
render.scene.add(cube)

let animate = function() {
  //  setTimeout(() => {
  requestAnimationFrame(animate)
  // }, 1000 / 30)
  p += 0.0125
  shaderMaterial.uniforms.p.value = p
  shaderMaterial.uniforms.maximum.value = parameters.maximum
  shaderMaterial.uniforms.size.value = parameters.size
  render.render()
}

animate()
