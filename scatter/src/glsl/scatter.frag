precision highp float;
precision highp int;
varying float vertexIndex;
uniform vec2 resolution;

void main() {
  vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
  if (dot(circCoord, circCoord) > 1.0) {
    discard;
  }

  if (int(mod(vertexIndex, 2.)) == 0) {
    if (int(mod(vertexIndex, 4.)) == 0) {
      gl_FragColor = vec4(5. / 255., 182. / 255., 145. / 255., 1.0);
    } else {
      gl_FragColor = vec4(36. / 255., 182. / 255., 1., 1.0);
    }
  } else {
    if (int(mod(vertexIndex, 4.)) == 3) {
      gl_FragColor = vec4(41. / 255., 43. / 255., 64. / 255., 1.0);
    } else {
      gl_FragColor = vec4(95. / 255., 114. / 255., 167. / 255., 1.0);
    }
  }
}