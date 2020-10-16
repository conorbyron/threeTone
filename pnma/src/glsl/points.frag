precision highp float;
precision highp int;
varying vec4 pointColor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform sampler2D crossTex;

void main() {
  vec4 color = pointColor / 255.;
  if (pointColor.r + pointColor.g + pointColor.b <= 0.1) {
    color = texture2D(crossTex, gl_PointCoord);
    if (color.a < 0.3) {
      discard;
    }
  } else {
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    color.a = 0.8;
    if (dot(circCoord, circCoord) > 1.0 || pointColor.a == 0.) {
      discard;
    }
  }
  gl_FragColor = color;
#ifdef USE_FOG
#ifdef USE_LOGDEPTHBUF_EXT
  float depth = gl_FragDepthEXT / gl_FragCoord.w;
#else
  float depth = gl_FragCoord.z / gl_FragCoord.w;
#endif
  float fogFactor = smoothstep(fogNear, fogFar, depth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif
}
