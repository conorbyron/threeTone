import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class Dot {
  constructor(x = 0, y = 0, z = 0) {
    this.geometry = new THREE.SphereBufferGeometry(0.5, 16, 16)
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000 })
    this.material.transparent = true
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.position.set(x, y, z)
  }

  setColorRGB(r, g, b) {
    this.material.color.setRGB(r, g, b)
  }

  setOpacity(a) {
    this.material.opacity = a
  }

  setScale(s) {
    this.mesh.scale.set(s, s, s)
  }
}

export class Renderer {
  constructor() {
    let width = window.innerWidth
    let height = window.innerHeight
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xffffff) //(0xe5e5dc);
    this.camera = new THREE.OrthographicCamera(
      width / -16,
      width / 16,
      height / 16,
      height / -16,
      -10,
      10000
    )
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(width, height)
    //this.renderer.setPixelRatio(0.1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.z = 50
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.25
    this.controls.enableZoom = true
    //let geometry = new THREE.BoxBufferGeometry(45, 45, 45);
    //let edges = new THREE.EdgesGeometry(geometry);
    //let line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xbfbfb3 }));
    //this.scene.add(line);
    document.body.appendChild(this.renderer.domElement)
  }

  add(obj) {
    this.scene.add(obj.mesh)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}
