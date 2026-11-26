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
  vec3 photoColor = texture2D(photo, uv).rgb;
  float gravel = smoothstep(.83, .965, uv.y);
  float leaves = smoothstep(.06, .19, photoColor.g - photoColor.b)
    * smoothstep(.48, .92, uv.y);
  float floor = max(gravel, leaves);
  vec2 pool = vec2(uv.x * 25., uv.y * 36.);
  float a = sin(pool.x + pool.y + sin(pool.y * .9 - time * .71) * 1.23 - time * .82);
  float b = sin(pool.x * 1.17 - pool.y * .83 + sin(pool.x - time * .58) * 1.5 + time * .95);
  float caustic = pow(max(0., 1. - abs(a + b) * 1.32), 4.);
  float beam = pow(.5 + .5 * sin((uv.x + uv.y * .32) * 30. + sin(time * .28) * .62), 5.);
  float glow = beam * (1. - uv.y) * .022;
  for (int i = 0; i < 3; ++i) {
    vec4 current = waves[i];
    float age = time - current.z;
    vec2 diff = (uv - current.xy) * vec2(1.77778, 1.);
    float drift = exp(-length(diff - vec2(age * .045, 0.)) * 6.3);
    glow += current.w * drift * smoothstep(0., .24, age) * (1. - smoothstep(.55, 2.8, age)) * .024;
  }
  vec3 light = vec3(.67, .88, .53) * (glow + (caustic - .16) * floor * .063);
  gl_FragColor = vec4(photoColor * (1. + caustic * floor * .09) + light, 1.);
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
