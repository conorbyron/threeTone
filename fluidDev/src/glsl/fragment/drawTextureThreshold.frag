precision highp float;

varying vec2 textureCoord;
uniform sampler2D inputTexture;

void main() { gl_FragColor = step(0.5, texture2D(inputTexture, textureCoord)); }
