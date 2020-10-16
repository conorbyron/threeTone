import * as THREE from 'three'
import vert from './glsl/points.vert'
import frag from './glsl/points.frag'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Image } from 'image-js'
import terrain from './images/terrain.png'
import heightmap from './images/heightmap.png'
import cross from './images/cross-outline.png'

let width = window.innerWidth
let height = window.innerHeight

let renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

let crossTexture = new THREE.TextureLoader().load(cross)

let scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)
scene.fog = new THREE.Fog(0xffffff, 1400, 1500)
let camera = new THREE.PerspectiveCamera(75, width / height, 1, 1500)
camera.position.z = 100

let cameraWrapper = new THREE.Group()
cameraWrapper.position.z = 100
cameraWrapper.add(camera)
scene.add(cameraWrapper)

let rotationValues = {
  vert: 0.4,
  hori: 0.0,
}
camera.rotation.x = Math.PI * rotationValues.vert

const step = 15
const planeSize = 200

let planeGeo = new THREE.PlaneBufferGeometry(
  step * 1000,
  step * 1000,
  planeSize - 1,
  planeSize - 1
)
let mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
let plane = new THREE.Mesh(planeGeo, mat)

let planeGeoFull = new THREE.PlaneBufferGeometry(
  step * 1000,
  step * 1000,
  1000 - 1,
  1000 - 1
)
let planeFull = new THREE.Mesh(planeGeoFull, mat)
planeFull.rotateZ(Math.PI * -0.5)
scene.add(planeFull)

let isDown = false
document.addEventListener('mousedown', () => {
  isDown = true
})
document.addEventListener('mouseup', () => {
  isDown = false
})
document.addEventListener('mousemove', (e) => {
  e.preventDefault()
  if (isDown) {
    let deltaX = e.movementX
    let deltaY = e.movementY
    rotationValues.vert = Math.min(
      Math.max(rotationValues.vert + deltaY / 400, 0.3),
      0.5
    )

    rotationValues.hori += deltaX / 400

    camera.rotation.x = Math.PI * rotationValues.vert
    cameraWrapper.rotation.z = Math.PI * rotationValues.hori
  }
})

let raycaster = new THREE.Raycaster()
//let controls = new OrbitControls(camera, renderer.domElement)
renderer.setPixelRatio(window.devicePixelRatio)

let pointsMaterial = new THREE.ShaderMaterial({
  uniforms: {
    resolution: {
      type: 'v2',
      value: new THREE.Vector2(
        renderer.domElement.width,
        renderer.domElement.height
      ),
    },
    fogColor: { type: 'c', value: scene.fog.color },
    fogNear: { type: 'f', value: scene.fog.near },
    fogFar: { type: 'f', value: scene.fog.far },
    cursor: {
      type: 'v3',
      value: new THREE.Vector3(0, 0, 0),
    },
    cursorNormal: {
      type: 'v3',
      value: new THREE.Vector3(0, 0, 0),
    },
    cursorRad: { type: 'f', value: 75 },
    crossTex: { type: 't', value: crossTexture },
  },
  vertexShader: vert,
  fragmentShader: frag,
  transparent: true,
  fog: true,
})

let points

Image.load(terrain)
  .then((terrainImage) => {
    Image.load(heightmap).then((heightmapImage) => {
      let vertices = []

      for (let i = 0; i < 1000; i++) {
        for (let j = 0; j < 1000; j++) {
          vertices.push((i - 500) * step, (j - 500) * step, 0)
        }
      }

      const vertexBuffer = new Float32Array(vertices)

      for (let i = 0; i < vertexBuffer.length / 3; i++) {
        vertexBuffer[3 * i + 2] = heightmapImage.data[4 * i]
      }

      const positionBuffer = new THREE.BufferAttribute(vertexBuffer, 3)

      for (let i = 0; i < planeSize; i++) {
        for (let j = 0; j < planeSize; j++) {
          planeGeo.attributes.position.array[(i * planeSize + j) * 3 + 2] =
            vertexBuffer[
              (i * (1000 / planeSize) * 1000 + j * (1000 / planeSize)) * 3 + 2
            ]
        }
      }

      planeGeoFull.attributes.position = positionBuffer
      planeGeoFull.computeVertexNormals()

      planeGeoFull.attributes.position.needsUpdate = true

      planeGeo.attributes.position.needsUpdate = true

      /*
      let wireframe = new THREE.WireframeGeometry(planeGeo)
      let line = new THREE.LineSegments(wireframe)
      line.material.color = new THREE.Color(0x000000)
      scene.add(line)
      */

      let pointsGeometry = new THREE.BufferGeometry()
      pointsGeometry.setAttribute('position', positionBuffer)
      pointsGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(terrainImage.data, 4)
      )
      pointsGeometry.setAttribute('normal', planeGeoFull.attributes.normal)

      points = new THREE.Points(pointsGeometry, pointsMaterial)
      points.rotateZ(Math.PI * -0.5)
      scene.add(points)
    })
  })
  .catch((err) => console.error(err))

function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

let movement = {
  moving: false,
  start: new THREE.Vector3(),
  end: new THREE.Vector3(),
  startMovement: function (start, end) {
    this.start.copy(start)
    this.end.copy(end)
    this.moving = true
    this.index = 0
  },
  update: function (position) {
    if (this.moving) {
      this.index += 0.01
      position.lerpVectors(this.start, this.end, easeInOutQuad(this.index))
      if (this.index >= 1) {
        this.moving = false
      }
    }
  },
}

var markerGeo = new THREE.PlaneGeometry(20, 20, 5, 5)
let wireframe = new THREE.WireframeGeometry(markerGeo)
let marker = new THREE.LineSegments(wireframe)
marker.material.color = new THREE.Color(0x000000)
marker.material.depthTest = false
marker.renderOrder = 10
scene.add(marker)

let mouseScreenPosition = { x: 0, y: 0 }
let mouseWorldPosition = new THREE.Vector3()

document.addEventListener('mousemove', (e) => {
  mouseScreenPosition.x = e.clientX
  mouseScreenPosition.y = e.clientY

  //console.log(Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2)))
})

document.addEventListener('click', (e) => {
  let dest = new THREE.Vector3().copy(mouseWorldPosition)
  dest.z += 100
  movement.startMovement(cameraWrapper.position, dest)
})

let axis = new THREE.Vector3(0, 0, 1)

const animate = () => {
  requestAnimationFrame(animate)
  raycaster.setFromCamera(
    {
      x: (mouseScreenPosition.x / window.innerWidth) * 2 - 1,
      y: -(mouseScreenPosition.y / window.innerHeight) * 2 + 1,
    },
    camera
  )
  const intersects = raycaster.intersectObjects([plane])
  if (intersects[0]) {
    const intersect = intersects[0]
    mouseWorldPosition.copy(intersect.point)
    marker.position.set(0, 0, 0)
    marker.lookAt(intersect.face.normal)
    marker.position.copy(mouseWorldPosition)
    pointsMaterial.uniforms.cursor.value
      .copy(mouseWorldPosition)
      .applyAxisAngle(axis, Math.PI * 0.5)
    pointsMaterial.uniforms.cursorNormal.value.copy(intersect.face.normal)
  }
  movement.update(cameraWrapper.position)
  renderer.render(scene, camera)
}

animate()
