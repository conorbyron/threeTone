/*
TODO:
-The way the ship moves is wrong. Currently it can steer through and redirect its velocity. It feels like a car when it should feel like a hockey puck with directed jets on it.
-This will affect the way the trail looks, probably for the worse.
-Enemies? Collections of cylinders coming together to form a blob?
-Stars? Other lighting effects?
-Give it a glow! Like a James Turrell piece.
-Sound!
*/
import * as THREE from 'three'
import Tone from 'tone'

let height = window.innerHeight
let width = window.innerWidth

let scene = new THREE.Scene()
let camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  1,
  2000
)
scene.background = new THREE.Color(0xffadaf)

let board = {
  width: 800,
  height: 800,
}

let cameraControl = {
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  distance: 50,
  zAngle: 0,
  elevationAngle: 0,
}

const turningDirections = {
  NONE: 0,
  LEFT: 1,
  RIGHT: 2,
}

let playerCharacter = {
  position: {
    x: 0,
    y: 0,
  },
  directionVector: {
    x: 0.0,
    y: 1.0,
  },
  directionRadians: 0.0,
  speed: 0.0,
  accelerating: false,
  turning: turningDirections.NONE,
  update() {
    if (this.accelerating) {
      if (this.speed < 10.0) {
        this.speed += 0.6
      }
    } else {
      if (this.speed > 0.0) {
        this.speed -= 0.1
      }
    }
    switch (this.turning) {
      case turningDirections.LEFT:
        this.directionRadians -= 0.05
        if (this.directionRadians <= 0) {
          this.directionRadians += 2.0
        }
        this.directionVector.x = Math.sin(Math.PI * this.directionRadians)
        this.directionVector.y = Math.cos(Math.PI * this.directionRadians)
        break
      case turningDirections.RIGHT:
        this.directionRadians += 0.05
        if (this.directionRadians >= 2.0) {
          this.directionRadians -= 2.0
        }
        this.directionVector.x = Math.sin(Math.PI * this.directionRadians)
        this.directionVector.y = Math.cos(Math.PI * this.directionRadians)
        break
      default:
        break
    }
    if (this.speed > 0.0) {
      this.position.x += this.directionVector.x * this.speed
      this.position.y += this.directionVector.y * this.speed
      if (this.position.x > board.width / 2) this.position.x = -board.width / 2
      else if (this.position.x < -board.width / 2)
        this.position.x = board.width / 2

      if (this.position.y > board.height / 2)
        this.position.y = -board.height / 2
      else if (this.position.y < -board.height / 2)
        this.position.y = board.height / 2
    }
  },
  turnClockWise() {
    this.turning = turningDirections.RIGHT
  },
  turnCounterClockWise() {
    this.turning = turningDirections.LEFT
  },
  stopTurning() {
    this.turning = turningDirections.NONE
  },
}

let renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

var planeGeometry = new THREE.PlaneGeometry(board.width, board.height)
var planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffdd77,
  side: THREE.FrontSide,
})
var plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.z = 0
scene.add(plane)

var geometry = new THREE.ConeGeometry(height / 120, height / 40, 20)
let material = new THREE.MeshBasicMaterial({ color: 0x75caff })
let mesh = new THREE.Mesh(geometry, material)
mesh.position.z = height / 240
scene.add(mesh)

camera.position.set(200, -400, 200) // The orthographic space is defined from this point forward! Everything you want to see has to fit inside it.
camera.up.set(0, 0, 1) // You need to set the up vector here so that the camera will be correctly re-oriented after changing position to look down at the plane.
camera.lookAt(0, 0, 0)

const keyDown = (e) => {
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      playerCharacter.turnCounterClockWise()
      break
    case 'ArrowRight':
      e.preventDefault()
      playerCharacter.turnClockWise()
      break
    case 'ArrowUp':
      e.preventDefault()
      playerCharacter.accelerating = true
      break
    case 'ArrowDown':
      e.preventDefault()
      break
  }
}

const keyUp = (e) => {
  e.preventDefault()
  switch (e.key) {
    case 'ArrowLeft':
      if (playerCharacter.turning === turningDirections.LEFT)
        playerCharacter.stopTurning()
      break
    case 'ArrowRight':
      if (playerCharacter.turning === turningDirections.RIGHT)
        playerCharacter.stopTurning()
      break
    case 'ArrowUp':
      playerCharacter.accelerating = false
      break
  }
}

window.addEventListener('keydown', keyDown)
window.addEventListener('keyup', keyUp)

let animate = function () {
  requestAnimationFrame(animate)
  playerCharacter.update()
  mesh.position.x = playerCharacter.position.x
  mesh.position.y = playerCharacter.position.y
  mesh.rotation.z = -Math.PI * playerCharacter.directionRadians
  renderer.render(scene, camera)
}

animate()

/*
let synth = new Tone.Synth().toMaster();
synth.triggerAttackRelease('C4', '8n');
*/
