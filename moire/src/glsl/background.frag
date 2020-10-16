precision highp float;
precision highp int;
varying float vertexIndex;
uniform vec2 resolution;
uniform sampler2D colors;
uniform float p;

void main() {
  vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
  if (dot(circCoord, circCoord) > 1.0) {
    discard;
  }
  float max = 11.0;
  float b = .5 * sin(2. * 3.14159 * mod((vertexIndex + p), max) / max) + .5;
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = texture2D(colors, uv);
}