precision highp float;

uniform float deltaT;       // Time between steps n
uniform float rho;          // Density n
uniform float epsilon;      // Distance between grid units n
uniform sampler2D velocity; // Advected velocity field, u_a n

varying vec2 textureCoord;

vec2 u(vec2 coord) { return texture2D(velocity, fract(coord)).xy; }

void main() {
  gl_FragColor = vec4((-2.0 * epsilon * rho / deltaT) *
                          ((u(textureCoord + vec2(epsilon, 0)).x -
                            u(textureCoord - vec2(epsilon, 0)).x) +
                           (u(textureCoord + vec2(0, epsilon)).y -
                            u(textureCoord - vec2(0, epsilon)).y)),
                      0.0, 0.0, 1.0);
}