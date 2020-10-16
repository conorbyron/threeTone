import * as THREE from 'three'
import { GPUComputationRenderer } from './jsm/misc/GPUComputationRenderer.js'
import standardVert from './glsl/vertex/standard.vert'
import arrowsVert from './glsl/vertex/arrows.vert'
import arrowsFrag from './glsl/frag/arrows.frag'
import drawTextureFrag from './glsl/frag/drawTexture.frag'
import drawTextureThresholdFrag from './glsl/frag/drawTextureThreshold.frag'
import advectFrag from './glsl/frag/advect.frag'
import addSplatFrag from './glsl/frag/addSplat.frag'
import clampColorsFrag from './glsl/frag/clampColors.frag'
import calcDivergenceFrag from './glsl/frag/calcDivergence.frag'
import jacobiIterationForPressureFrag from './glsl/frag/jacobiIterationForPressure.frag'
import subtractPressureGradientFrag from './glsl/frag/subtractPressureGradient.frag'

/**
 * 2D fluid simulation code for
 * http://jamie-wong.com/2016/08/04/webgl-fluid-simulation/
 */
window.FluidSim = function(canvasId, options) {
  options = options || {}

  options.initVFn = options.initVFn || [
    'sin(2.0 * 3.1415 * y)',
    'sin(2.0 * 3.1415 * x)'
  ]

  options.initCFn = options.initCFn || [
    'step(1.0, mod(floor((x + 1.0) / 0.2) + floor((y + 1.0) / 0.2), 2.0))',
    'step(1.0, mod(floor((x + 1.0) / 0.2) + floor((y + 1.0) / 0.2), 2.0))',
    'step(1.0, mod(floor((x + 1.0) / 0.2) + floor((y + 1.0) / 0.2), 2.0))'
  ]

  if (options.threshold === undefined) {
    options.threshold = true
  }

  if (options.advectV === undefined) {
    options.advectV = true
  }

  if (options.applyPressure === undefined) {
    options.applyPressure = false
  }

  if (options.showArrows === undefined) {
    options.showArrows = true
  }

  if (options.dyeSpots === undefined) {
    options.dyeSpots = false
  }

  // For silly reasons, these have to be equal for now.
  // This is because I assumed grid spacing was equal along
  // each axis, so if you want to change these to not be equal, you'd have to
  // carefully go through the code and decide which values of EPSILON should be
  // 1/WIDTH, and which should be 1/HEIGHT.
  let WIDTH = options.size || 400
  let HEIGHT = WIDTH
  let EPSILON = 1 / WIDTH

  // We assume every time step will be a 120th of a second.
  // The animation loop runs at 60 fps (hopefully), so we're simulating 2x
  // slow-mo.
  let DELTA_T = 1 / 120.0

  // We arbitrarily set our fluid's density to 1 (this is rho in equations)
  let DENSITY = 1.0

  let scene = new THREE.Scene()
  // Will need to make another camera to render the plane proportionately within a 3d scene
  let camera = new THREE.OrthographicCamera(
    WIDTH / -2,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT / -2,
    -1,
    1
  )
  camera.position.z = 1

  let renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer)

  let canvas = document.getElementById(canvasId)
  canvas.style.margin = '0 auto'
  canvas.style.display = 'block'

  let gl = GL.create(canvas)
  gl.canvas.width = WIDTH
  gl.canvas.height = HEIGHT
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // Standard 2-triangle mesh covering the viewport
  // when draw with gl.TRIANGLE_STRIP
  let standardMesh = gl.Mesh.load({
    vertices: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
    coords: [[0, 1], [1, 1], [0, 0], [1, 0]] // do I even need to do this in THREE.JS? If I'm just going to do a UV mapping in the end, probably not.
  })

  let standardGeometry = new THREE.Geometry(2, 2, 1, 1)

  standardGeometry.vertices.push(
    new THREE.Vector2(-1, -1),
    new THREE.Vector2(-1, 1),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, -1)
  )

  standardGeometry.faces.push(new THREE.Face3(0, 1, 2))
  standardGeometry.faces.push(new THREE.Face3(0, 2, 3))

  // Given a texture holding a 2D velocity field, draw arrows
  // showing the direction of the fluid flow.
  let drawVectorFieldArrows = (function() {
    // Triangle pointing towards positive x axis
    // with baseline on the y axis
    let triangleVertices = [[0, 0.2], [1, 0], [0, -0.2]]

    let arrowsGeometry = new THREE.BufferGeometry()
    let vertices = []
    let positions = []

    let INTERVAL = 30

    for (let i = INTERVAL / 2; i < HEIGHT; i += INTERVAL) {
      for (let j = INTERVAL / 2; j < WIDTH; j += INTERVAL) {
        for (let k = 0; k < 3; k++) {
          vertices.push(triangleVertices[k])
          positions.push([(2 * j) / WIDTH - 1, (2 * i) / HEIGHT - 1])
        }
      }
    }

    arrowsGeometry.addAttribute(
      'gl_Vertex',
      new THREE.BufferAttribute(new Float32Array(vertices), 2)
    )

    arrowsGeometry.addAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 2)
    )

    return function(velocityTexture) {
      let arrowsShader = new THREE.RawShaderMaterial({
        uniforms: {
          velocity: { type: 't', value: velocityTexture }
        },
        vertexShader: arrowsVert,
        fragmentShader: arrowsFrag
      })

      let arrowsMesh = new THREE.Mesh(arrowsGeometry, arrowsShader)

      shader.draw(arrowsMesh, gl.TRIANGLES) // renderpass
    }
  })()

  // Given glsl expressions for r, g, b, a mapping (x, y) -> a value, return
  // a function that will paint a color generated by that function evaluated at
  // every pixel of the output buffer. (x, y) will be in the range
  // ([-1, 1], [-1, 1]).
  let makeFunctionPainter = function(r, g, b, a) {
    r = r || '0.0'
    g = g || '0.0'
    b = b || '0.0'
    a = a || '0.0'

    let shader = new gl.Shader({
      vertexShader: standardVert,
      fragmentShader:
        '\
        varying vec2 textureCoord; \
        void main() { \
          float x = 2.0 * textureCoord.x - 1.0; \
          float y = 2.0 * textureCoord.y - 1.0; \
          gl_FragColor = vec4(' +
        [r, g, b, a].join(',') +
        '); \
        } \
      '
    })

    return function() {
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  }

  let drawBlack = makeFunctionPainter('0.0', '0.0', '0.0', '1.0')

  // Draw a texture directly to the framebuffer.
  // Will stretch to fit, but in practice the texture and the framebuffer should be
  // the same size.
  let drawTexture = (function() {
    let shader = new gl.Shader(standardVert, drawTextureFrag)

    return function(inputTexture) {
      inputTexture.bind(0)
      shader.uniforms({
        input: 0
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Draw a texture to the framebuffer, thresholding at 0.5
  let drawTextureThreshold = (function() {
    let shader = new gl.Shader(standardVert, drawTextureThresholdFrag)

    return function(inputTexture) {
      inputTexture.bind(0)
      shader.uniforms({
        input: 0
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Given an velocity texture and a time delta, advect the
  // quantities in the input texture into the output texture
  let advect = (function() {
    let shader = new gl.Shader(standardVert, advectFrag)

    return function(inputTexture, velocityTexture) {
      inputTexture.bind(0)
      velocityTexture.bind(1)

      shader.uniforms({
        deltaT: DELTA_T,
        input: 0,
        velocity: 1
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Apply a "splat" of change to a given place with a given
  // blob radius. The effect of the splat has an exponential falloff.
  let addSplat = (function() {
    let shader = new gl.Shader(standardVert, addSplatFrag)

    return function(inputTexture, change, center, radius) {
      inputTexture.bind(0)
      shader.uniforms({
        change: change,
        center: center,
        radius: radius,
        inputTex: 0
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Make sure all the color components are between 0 and 1
  let clampColors = (function() {
    let shader = new gl.Shader(standardVert, clampColorsFrag)

    return function(inputTexture) {
      inputTexture.bind(0)
      shader.uniforms({
        inputTex: 0
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Calculate the divergence of the advected velocity field, and multiply by
  // (2 * epsilon * rho / deltaT).
  let calcDivergence = (function() {
    let shader = new gl.Shader(standardVert, calcDivergenceFrag)

    return function(velocityTexture) {
      velocityTexture.bind(0)
      shader.uniforms({
        velocity: 0,
        epsilon: EPSILON,
        deltaT: DELTA_T,
        rho: DENSITY
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Perform a single iteration of the Jacobi method in order to solve for
  // pressure.
  let jacobiIterationForPressure = (function() {
    let shader = new gl.Shader(
      standardVertexShaderSrc,
      jacobiIterationForPressureFrag
    )

    return function(divergenceTexture, pressureTexture) {
      divergenceTexture.bind(0)
      pressureTexture.bind(1)
      shader.uniforms({
        divergence: 0,
        pressure: 1,
        epsilon: EPSILON
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  // Subtract the pressure gradient times a constant from the advected velocity
  // field.
  let subtractPressureGradient = (function() {
    let shader = new gl.Shader(
      standardVertexShaderSrc,
      subtractPressureGradientFrag
    )

    return function(velocityTexture, pressureTexture) {
      velocityTexture.bind(0)
      pressureTexture.bind(1)
      shader.uniforms({
        velocity: 0,
        pressure: 1,
        epsilon: EPSILON,
        deltaT: DELTA_T,
        rho: DENSITY
      })
      shader.draw(standardMesh, gl.TRIANGLE_STRIP)
    }
  })()

  let makeTextures = function(names) {
    const renderTargetParams = {
      stencilBuffer: false,
      depthBuffer: false,
      type: THREE.FloatType
    }

    let ret = {}

    names.forEach(function(name) {
      ret[name] = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, renderTargetParams)
    })

    ret.swap = function(a, b) {
      let temp = ret[a]
      ret[a] = ret[b]
      ret[b] = temp
    }

    return ret
  }

  let textures = makeTextures([
    'velocity0',
    'velocity1',
    'color0',
    'color1',
    'divergence',
    'pressure0',
    'pressure1'
  ])

  let initVFnPainter = makeFunctionPainter(
    options.initVFn[0],
    options.initVFn[1]
  )
  let initCFnPainter = makeFunctionPainter(
    options.initCFn[0],
    options.initCFn[1],
    options.initCFn[2]
  )

  let reset = function() {
    textures.velocity0.drawTo(initVFnPainter)
    textures.color0.drawTo(initCFnPainter)
    textures.pressure0.drawTo(drawBlack)
  }

  reset()

  // Reset the simulation on double click
  canvas.addEventListener('dblclick', reset)

  // Returns true if the canvas is on the screen
  // If "middleIn" is true, then will only return true if the middle of the
  // canvas is within the scroll window.
  let onScreen = function(middleIn) {
    let container = canvas.offsetParent

    let canvasBottom = canvas.offsetTop + canvas.height
    let canvasTop = canvas.offsetTop

    let containerTop = window.scrollY
    let containerBottom = window.scrollY + window.innerHeight

    if (middleIn) {
      return (
        containerTop < (canvasTop + canvasBottom) / 2 &&
        (canvasTop + canvasBottom) / 2 < containerBottom
      )
    } else {
      return containerTop < canvasBottom && containerBottom > canvasTop
    }
  }

  gl.ondraw = function() {
    // If the canvas isn't visible, don't draw it
    if (!onScreen()) return

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    if (options.threshold) {
      drawTextureThreshold(textures.color0)
    } else {
      drawTexture(textures.color0)
    }

    if (options.showArrows) {
      drawVectorFieldArrows(textures.velocity0)
    }
  }

  gl.onupdate = function() {
    // If the canvas isn't fully on-screen, don't run the simulation
    if (!onScreen(true)) return

    if (options.advectV) {
      // Advect the velocity texture through itself, leaving the result in
      // textures.velocity0
      textures.velocity1.drawTo(function() {
        advect(textures.velocity0, textures.velocity0)
      })
      textures.swap('velocity0', 'velocity1')
    }

    if (options.applyPressure) {
      // Calculate the divergence, leaving the result in textures.divergence
      textures.divergence.drawTo(function() {
        calcDivergence(textures.velocity0)
      })

      // Calculate the pressure, leaving the result in textures.pressure0
      let JACOBI_ITERATIONS = 10

      for (let i = 0; i < JACOBI_ITERATIONS; i++) {
        textures.pressure1.drawTo(function() {
          jacobiIterationForPressure(textures.divergence, textures.pressure0)
        })
        textures.swap('pressure0', 'pressure1')
      }

      // Subtract the pressure gradient from the advected velocity texture,
      // leaving the result in textures.velocity0
      textures.velocity1.drawTo(function() {
        subtractPressureGradient(textures.velocity0, textures.pressure0)
      })
      textures.swap('velocity0', 'velocity1')
    }

    // Advect the color field, leaving the result in textures.color0
    textures.color1.drawTo(function() {
      advect(textures.color0, textures.velocity0)
    })
    textures.swap('color0', 'color1')

    if (options.dyeSpots) {
      // Add a few spots slowly emitting dye to prevent the color from
      // eventually converging to the grey-ish average color of the whole fluid
      let addDyeSource = function(color, location) {
        textures.color1.drawTo(function() {
          addSplat(textures.color0, color.concat([0.0]), location, 0.01)
        })
        textures.swap('color0', 'color1')
      }

      // Add red to bottom left
      addDyeSource([0.004, -0.002, -0.002], [0.2, 0.2])

      // Add blue to the top middle
      addDyeSource([-0.002, -0.002, 0.004], [0.5, 0.9])

      // Add green to the bottom right
      addDyeSource([-0.002, 0.004, -0.002], [0.8, 0.2])
    }
  }

  gl.onmousemove = function(ev) {
    if (ev.dragging) {
      textures.velocity1.drawTo(function() {
        addSplat(
          textures.velocity0,
          [(10.0 * ev.deltaX) / WIDTH, (-10.0 * ev.deltaY) / HEIGHT, 0.0, 0.0],
          [ev.offsetX / WIDTH, 1.0 - ev.offsetY / HEIGHT],
          0.01
        )
      })
      textures.swap('velocity0', 'velocity1')
    }
  }

  gl.animate()
}
