precision highp float;
precision highp int;
attribute float index;
varying float vertexIndex;
uniform float p;

// uniform vec2 texResolution;
// uniform sampler2D paint;

void main() {
  vertexIndex = index;
  float max = 11.0;
  float b = .5 * sin(2. * 3.14159 * mod((vertexIndex + p), max) / max) + .5;
  gl_PointSize = 12.0 + b * 30.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}