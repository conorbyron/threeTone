precision highp float;

uniform vec4 change;
uniform vec2 center;
uniform float radius;
uniform sampler2D inputTex;

varying vec2 textureCoord;

void main() {
  float dx = center.x - textureCoord.x;
  float dy = center.y - textureCoord.y;
  vec4 cur = texture2D(inputTex, textureCoord);
  gl_FragColor = cur + change * exp(-(dx * dx + dy * dy) / radius);
}