import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

let height = window.innerHeight
let width = window.innerWidth

const svgs = ((r) =>
  r
    .keys()
    .map(r)
    .map((e) => e.default))(require.context('../svgs', false, /\.(svg)$/))

let camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  1,
  2000
)

let scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

function loadSVG(url) {
  //

  //

  var helper = new THREE.GridHelper(160, 10)
  helper.rotation.x = Math.PI / 2
  scene.add(helper)

  //

  var loader = new SVGLoader()

  loader.load(url, function (data) {
    console.log(data)
    var paths = data.paths

    var group = new THREE.Group()
    group.scale.multiplyScalar(0.25)
    group.position.x = -70
    group.position.y = 70
    group.scale.y *= -1

    for (var i = 0; i < paths.length; i++) {
      var path = paths[i]

      var material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x000000),
        opacity: path.userData.style.fillOpacity,
        transparent: path.userData.style.fillOpacity < 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: true,
      })

      var strokeColor = path.userData.style.stroke

      var material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x000000),
        opacity: path.userData.style.strokeOpacity,
        transparent: path.userData.style.strokeOpacity < 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: true,
      })

      for (var j = 0, jl = path.subPaths.length; j < jl; j++) {
        var subPath = path.subPaths[j]

        var geometry = SVGLoader.pointsToStroke(
          subPath.getPoints(),
          path.userData.style
        )

        if (geometry) {
          var mesh = new THREE.Mesh(geometry, material)

          group.add(mesh)
        }
      }
    }

    scene.add(group)
  })
  animate()
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)

  render()
}

function render() {
  renderer.render(scene, camera)
}
console.log(svgs[0])
loadSVG(svgs[0])
