precision highp float;
precision highp int;
attribute float index;
varying float vertexIndex;

// uniform vec2 texResolution;
// uniform sampler2D paint;

float rect(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

void main() {
  vertexIndex = index;
  gl_PointSize = 9.0;
  gl_Position = projectionMatrix * modelViewMatrix *
                vec4(position + 1000.0 * cameraPosition, 1.0);
}