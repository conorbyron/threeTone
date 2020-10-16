precision highp float;
precision highp int;
attribute float index;
varying float vertexIndex;
uniform float p;

// uniform vec2 texResolution;
// uniform sampler2D paint;

float rect(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

void main() {
  vertexIndex = index;
  float max = 11.0;
  float b = .5 * sin(2. * 3.14159 * mod((vertexIndex + p), max) / max) + .5;
  gl_PointSize = 9.5 + b * 27.5;
  gl_Position = projectionMatrix * modelViewMatrix *
                vec4(position + 1000.0 * cameraPosition, 1.0);
}