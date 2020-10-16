attribute vec4 gl_Vertex;
attribute vec4 gl_TexCoord;
attribute vec2 position;

uniform sampler2D velocity;


mat2 rot(float angle) {
  float c = cos(angle);
  float s = sin(angle);

  return mat2(vec2(c, -s), vec2(s, c));
}

void main() {
  vec2 v = texture2D(velocity, (position + 1.0) / 2.0).xy;
  float scale = 0.05 * length(v);
  float angle = atan(v.y, v.x);
  mat2 rotation = rot(-angle);
  gl_Position = vec4((rotation * (scale * gl_Vertex.xy)) + position, 0.0, 1.0);
}