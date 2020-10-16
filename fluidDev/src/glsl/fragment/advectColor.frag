precision highp float;

uniform float deltaT;
uniform sampler2D color;
uniform sampler2D velocity;
varying vec2 textureCoord;

void main() {
  vec2 u = texture2D(velocity, textureCoord).xy;

  vec2 pastCoord = fract(textureCoord - (0.5 * deltaT * u));
  gl_FragColor = texture2D(color, pastCoord);
}