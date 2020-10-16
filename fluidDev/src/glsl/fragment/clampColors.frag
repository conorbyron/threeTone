precision highp float;

uniform sampler2D inputTex;
varying vec2 textureCoord;

void main() {
  gl_FragColor = clamp(texture2D(inputTex, textureCoord), 0.0, 1.0);
}