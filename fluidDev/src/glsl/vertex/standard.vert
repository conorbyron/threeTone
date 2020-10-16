attribute vec4 gl_Vertex;
attribute vec4 gl_TexCoord;

vec4 ftransform() { return gl_ModelViewProjectionMatrix * gl_Vertex; }

varying vec2 textureCoord;

void main() {
  textureCoord = gl_TexCoord.xy;
  gl_Position = gl_Vertex;
}