import * as THREE from 'three'
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
  speed: 0.4,
  detail: 8,
  feedback: 4,
  color1: [74, 170, 164],
  color2: [200, 200, 200],
  color3: [55, 5, 90],
  height: 1,
  exposure: 1,
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0
}
gui.addColor(parameters, 'color1')
gui.addColor(parameters, 'color2')
gui.addColor(parameters, 'color3')
gui.add(parameters, 'speed', 0, 2).step(0.01)
gui.add(parameters, 'detail', 0, 10).step(1)
gui.add(parameters, 'feedback', 1, 10).step(0.05)
gui.add(parameters, 'height', 0, 5).step(0.05)
gui.add(parameters, 'exposure', 0.1, 2).onChange(value => {
  renderer.toneMappingExposure = Math.pow(value, 4.0)
})
gui.add(parameters, 'bloomThreshold', 0.0, 1.0).onChange(value => {
  bloomPass.threshold = Number(value)
})
gui.add(parameters, 'bloomStrength', 0.0, 3.0).onChange(value => {
  bloomPass.strength = Number(value)
})
gui
  .add(parameters, 'bloomRadius', 0.0, 1.0)
  .step(0.01)
  .onChange(value => {
    bloomPass.radius = Number(value)
  })

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ReinhardToneMapping
document.body.appendChild(renderer.domElement)

let shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { type: 'f', value: 0 },
    speed: { type: 'f', value: parameters.speed },
    colors: {
      value: {
        color1: new THREE.Color(
          parameters.color1[0],
          parameters.color1[1],
          parameters.color1[2]
        ),
        color2: new THREE.Color(
          parameters.color2[0],
          parameters.color2[1],
          parameters.color2[2]
        ),
        color3: new THREE.Color(
          parameters.color3[0],
          parameters.color3[1],
          parameters.color3[2]
        )
      }
    },
    detail: { type: 'i', value: parameters.detail },
    feedback: { type: 'f', value: parameters.feedback },
    height: { type: 'f', value: parameters.height }
  },
  vertexShader,
  fragmentShader
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

camera.position.z = 25
camera.position.y = 5
camera.lookAt(0, 0, 0)
controls.update()

let renderScene = new RenderPass(scene, camera)

let bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
)
bloomPass.threshold = parameters.bloomThreshold
bloomPass.strength = parameters.bloomStrength
bloomPass.radius = parameters.bloomRadius
let composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

let time = 0
let animate = function() {
  requestAnimationFrame(animate)
  time += parameters.speed * 0.01
  shaderMaterial.uniforms.time.value = time
  shaderMaterial.uniforms.colors.value.color1.setRGB(
    parameters.color1[0],
    parameters.color1[1],
    parameters.color1[2]
  )
  shaderMaterial.uniforms.colors.value.color2.setRGB(
    parameters.color2[0],
    parameters.color2[1],
    parameters.color2[2]
  )
  shaderMaterial.uniforms.colors.value.color3.setRGB(
    parameters.color3[0],
    parameters.color3[1],
    parameters.color3[2]
  )
  shaderMaterial.uniforms.detail.value = parameters.detail
  shaderMaterial.uniforms.feedback.value = parameters.feedback
  shaderMaterial.uniforms.height.value = parameters.height
  composer.render()
}
animate()
