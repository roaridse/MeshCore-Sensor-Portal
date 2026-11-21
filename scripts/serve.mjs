import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number.parseInt(process.env.SENSOR_PORTAL_PORT || "4173", 10);
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
    let target = join(root, relative || "index.html");
    if ((await stat(target)).isDirectory()) target = join(target, "index.html");
    const body = await readFile(target);
    response.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Ikke funnet");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Sensor Portal: http://127.0.0.1:${port}`);
});
