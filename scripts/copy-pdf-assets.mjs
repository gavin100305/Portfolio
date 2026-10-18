import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const destination = new URL("../public/pdfjs/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(join(source, "build/pdf.worker.min.mjs"), new URL("pdf.worker.min.mjs", destination));
await cp(join(source, "standard_fonts"), new URL("standard_fonts/", destination), { recursive: true });
await cp(join(source, "wasm"), new URL("wasm/", destination), { recursive: true });
await cp(join(source, "LICENSE"), new URL("LICENSE", destination));
