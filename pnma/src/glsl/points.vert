precision highp float;
precision highp int;
attribute vec4 color;
varying vec4 pointColor;
uniform vec3 cursor;
uniform float cursorRad;
uniform vec3 cursorNormal;

// uniform vec2 texResolution;
// uniform sampler2D paint;

void main() {
  pointColor = color;
  gl_PointSize = 20. * color.a / 255.;
  float cursorBump = 0.0;
  float cursorDist = length(cursor - position);
  if (cursorDist <= cursorRad) {
    cursorBump = sqrt(pow(cursorRad, 2.) - pow(cursorDist, 2.));
  }
  gl_Position =
      projectionMatrix * modelViewMatrix *
      vec4(position + (gl_PointSize * 0.5 + cursorBump) * normal, 1.0);
}