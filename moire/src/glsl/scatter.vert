precision highp float;
precision highp int;
attribute float index;
varying vec4 color;

// uniform vec2 texResolution;
// uniform sampler2D paint;

float rect(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

void main() {
  if (int(mod(index, 2.)) == 0) {
    color = vec4(0., 0., 0., 1.0);
  } else {
    if (int(mod(index, 6.)) == 1) {
      color = vec4(45. / 255., 20. / 255., 232. / 255., 1.0);
    } else {
      if (int(mod(index, 6.)) == 3) {
        color = vec4(2. / 255., 125. / 255., 106. / 255., 1.0);
      } else {
        //color = vec4(196. / 255., 66. / 255., 163. / 255., 1.0);
        color = vec4(100. / 255., 41. / 255., 218. / 255., 1.0);
      }
    }
  }

  gl_PointSize = 3.0;
  gl_Position = projectionMatrix * modelViewMatrix *
                vec4(position + 1000.0 * cameraPosition, 1.0);
}