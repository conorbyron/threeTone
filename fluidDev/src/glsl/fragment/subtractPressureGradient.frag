precision highp float;

uniform float deltaT;       // Time between steps n
uniform float rho;          // Density n
uniform float epsilon;      // Distance between grid units n
uniform sampler2D velocity; // Advected velocity field, u_a n
uniform sampler2D pressure; // Solved pressure field n

varying vec2 textureCoord;

float p(vec2 coord) { return texture2D(pressure, fract(coord)).x; }

void main() {
  vec2 u_a = texture2D(velocity, textureCoord).xy;

  float diff_p_x = (p(textureCoord + vec2(epsilon, 0.0)) -
                    p(textureCoord - vec2(epsilon, 0.0)));
  float u_x = u_a.x - deltaT / (2.0 * rho * epsilon) * diff_p_x;

  float diff_p_y = (p(textureCoord + vec2(0.0, epsilon)) -
                    p(textureCoord - vec2(0.0, epsilon)));
  float u_y = u_a.y - deltaT / (2.0 * rho * epsilon) * diff_p_y;

  gl_FragColor = vec4(u_x, u_y, 0.0, 0.0);
}