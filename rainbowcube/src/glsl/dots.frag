precision highp float;
precision highp int;
varying float vertexIndex;
uniform vec2 resolution;
uniform float p;
uniform float maximum;

float hue2rgb(float f1, float f2, float h) {
  if (h < 0.0)
    h += 1.0;
  else if (h > 1.0)
    h -= 1.0;
  float res;
  if ((6.0 * h) < 1.0)
    res = f1 + (f2 - f1) * 6.0 * h;
  else if ((2.0 * h) < 1.0)
    res = f2;
  else if ((3.0 * h) < 2.0)
    res = f1 + (f2 - f1) * ((2.0 / 3.0) - h) * 6.0;
  else
    res = f1;
  return res;
}

vec3 hsl2rgb(vec3 hsl) {
  vec3 rgb;

  if (hsl.y == 0.0) {
    rgb = vec3(hsl.z); // Luminance
  } else {
    float f2;

    if (hsl.z < 0.5)
      f2 = hsl.z * (1.0 + hsl.y);
    else
      f2 = hsl.z + hsl.y - hsl.y * hsl.z;

    float f1 = 2.0 * hsl.z - f2;

    rgb.r = hue2rgb(f1, f2, hsl.x + (1.0 / 3.0));
    rgb.g = hue2rgb(f1, f2, hsl.x);
    rgb.b = hue2rgb(f1, f2, hsl.x - (1.0 / 3.0));
  }
  return rgb;
}

vec3 hsl2rgb(float h, float s, float l) { return hsl2rgb(vec3(h, s, l)); }

void main() {
  vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
  if (dot(circCoord, circCoord) > 1.0) {
    discard;
  }
  // float b = mod((vertexIndex + p), maximum) / maximum;
  float b = mod((vertexIndex + p), maximum) / maximum;
  gl_FragColor = vec4(hsl2rgb(vec3(b, 1.0, 0.9)), 1.0);
}