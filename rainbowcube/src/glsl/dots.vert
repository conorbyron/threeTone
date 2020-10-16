precision highp float;
precision highp int;
attribute float index;
varying float vertexIndex;
uniform float p;
uniform float size;

// uniform vec2 texResolution;
// uniform sampler2D paint;

void main() {
  vertexIndex = index;
  gl_PointSize = size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}