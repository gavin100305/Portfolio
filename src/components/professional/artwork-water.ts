import type { createPondSwim } from "./artwork-pond";

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
uniform sampler2D floorPhoto;
uniform sampler2D koiLayer;
uniform sampler2D surfacePhoto;
uniform sampler2D normals;

void main() {
  vec2 slope = (texture2D(normals, uv).rg * 255. - 128.) / 128.;
  vec2 bend = slope * vec2(.019, .034);
  vec3 bed = texture2D(floorPhoto, uv + bend * 1.45).rgb;
  // Low-frequency surface relief also refracts a fish as it crosses still water.
  float relief = texture2D(surfacePhoto, uv).r - .5;
  vec2 throughWater = uv + bend + relief * vec2(.0022, -.0034);
  vec2 blur = vec2(.00085, .0015);
  vec4 fish = .52 * texture2D(koiLayer, throughWater)
    + .16 * texture2D(koiLayer, throughWater + blur)
    + .16 * texture2D(koiLayer, throughWater - vec2(blur.x, 0.))
    + .16 * texture2D(koiLayer, throughWater - vec2(0., blur.y));
  float shadow = texture2D(koiLayer, uv - vec2(.012,.024)).a;
  bed *= 1. - .14 * shadow;

  // Blue-green scattered light softens the submerged outlines. Surface
  // reflections cross the markings, with highlights tilted by the local wake.
  vec3 submerged = fish.rgb * vec3(.82, .88, .88) + vec3(.021, .067, .088) * fish.a;
  vec3 color = bed * (1. - fish.a) + submerged;
  float sky = texture2D(surfacePhoto, uv + bend * 3.8).r;
  float facing = dot(slope, vec2(-.54, -.84));
  float reflection = clamp(.024 + .115 * sky + facing * .20, .008, .29);
  color *= 1. + .13 * facing + (sky - .5) * .055;
  color = mix(color, vec3(.57, .73, .80), reflection);
  gl_FragColor = vec4(color, 1.);
}
`;

export function createArtworkSurface(
  canvas: HTMLCanvasElement,
  fish: HTMLCanvasElement,
  bedImage: HTMLImageElement,
  surfaceImage: HTMLImageElement,
) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!context) return null;
  const gl = context;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const fishTexture = gl.createTexture();
  const bedTexture = gl.createTexture();
  const surfaceTexture = gl.createTexture();
  const normalTexture = gl.createTexture();

  function dispose() {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(fishTexture);
    gl.deleteTexture(bedTexture);
    gl.deleteTexture(surfaceTexture);
    gl.deleteTexture(normalTexture);
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

  if (!program || !buffer || !fishTexture || !bedTexture || !surfaceTexture || !normalTexture || !attach(gl.VERTEX_SHADER, vertex) || !attach(gl.FRAGMENT_SHADER, fragment)) {
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

  bindImage(gl.TEXTURE3, normalTexture, new ImageData(1, 1));
  bindImage(gl.TEXTURE1, bedTexture, bedImage);
  bindImage(gl.TEXTURE2, surfaceTexture, surfaceImage);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  bindImage(gl.TEXTURE0, fishTexture, fish);
  gl.uniform1i(gl.getUniformLocation(program, "koiLayer"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "floorPhoto"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "surfacePhoto"), 2);
  gl.uniform1i(gl.getUniformLocation(program, "normals"), 3);
  let allocated = false;

  return {
    draw(flow: ReturnType<typeof createPondSwim>) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, fish);
      gl.activeTexture(gl.TEXTURE3);
      if (allocated) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, flow.normals);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flow.normals);
        allocated = true;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose,
  };
}
