precision highp float;
precision highp int;

void main() {
  vec3 color = vec3(255., 235., 127.) / 255.;
  gl_FragColor = vec4(color, 1.0);
}