// Texture coordinates run from the upper left, like the photograph and pointer.
const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}
`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform sampler2D photo;
uniform float time;
uniform vec4 waves[3];

void main() {
  // Work in aspect-correct pond coordinates so ripples stay circular.
  vec2 p = uv * vec2(1.77778, 1.);
  float primary = p.x * 28. + p.y * 13. + sin(p.y * 9. + time * .58) - time * 1.55;
  float crossWave = p.x * 14. - p.y * 33. + sin(p.x * 7. - time * .44) * 1.8 + time * 1.07;
  vec2 at = uv + vec2(sin(primary) * .0017 + sin(crossWave) * .0011,
    cos(primary) * .0022 - cos(crossWave) * .0014);
  float rippleLight = 0.;
  for (int i = 0; i < 3; ++i) {
    vec4 impulse = waves[i];
    float age = time - impulse.z;
    vec2 offset = (uv - impulse.xy) * vec2(1.77778, 1.);
    float radius = length(offset);
    float pulse = smoothstep(0., .12, age) * (1. - smoothstep(.82, 2.85, age));
    float front = radius - age * .265 + sin(primary * .7 - crossWave * .19) * .006 * min(age, 1.);
    float ring = sin(front * 112.) * exp(-abs(front) * 46.) * pulse * impulse.w;
    at += offset / max(radius, .009) * ring * vec2(.008, .013);
    rippleLight += max(ring, 0.) * .106 + min(ring, 0.) * .028;
  }
  float folded = sin(primary + sin(crossWave * .72) * 1.42) + sin(crossWave);
  float caustic = pow(max(0., 1. - abs(folded) * 1.13), 5.);
  float patch = smoothstep(-.55, .72, sin(p.x * 5.6 + p.y * 4.4 - time * .28)
    + cos(p.y * 6.8 - p.x * 2.4 + time * .34) * .58);
  float light = caustic * (.012 + patch * .032) + rippleLight;
  vec3 color = texture2D(photo, clamp(at, .001, .999)).rgb;
  // Brighter subjects inherit the same moving light as the bed beneath them.
  color = color * (1. + light * 1.22) + vec3(.39, .67, .64) * light;
  gl_FragColor = vec4(color, 1.);
}
`;

export function createArtworkSurface(canvas: HTMLCanvasElement, source: HTMLCanvasElement) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!context) return null;
  const gl = context;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();

  function dispose() {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
  }

  function attach(type: number, source: string) {
    const shader = gl.createShader(type);
    if (!program || !shader) return false;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return false;
    gl.attachShader(program, shader);
    return true;
  }

  if (!program || !buffer || !texture || !attach(gl.VERTEX_SHADER, vertex) || !attach(gl.FRAGMENT_SHADER, fragment)) {
    dispose();
    return null;
  }

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  function bindImage(unit: number, target: WebGLTexture, image: TexImageSource) {
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  bindImage(gl.TEXTURE0, texture, source);
  gl.uniform1i(gl.getUniformLocation(program, "photo"), 0);
  const clock = gl.getUniformLocation(program, "time");
  const impulses = gl.getUniformLocation(program, "waves[0]");

  return {
    draw(time: number, waves: Float32Array) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform1f(clock, time);
      gl.uniform4fv(impulses, waves);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose,
  };
}
