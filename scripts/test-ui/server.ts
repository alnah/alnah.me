import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const distDir = path.join(process.cwd(), "dist");

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

function resolveDistAsset(pathname: string) {
  const decodedPath = decodeURIComponent(pathname.split("?")[0] || "/");
  const safePath = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, "");

  if (safePath === "/" || safePath === ".") {
    return path.join(distDir, "index.html");
  }

  const requestedPath = path.join(distDir, safePath.replace(/^\//, ""));

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  if (!path.extname(requestedPath)) {
    return path.join(requestedPath, "index.html");
  }

  return requestedPath;
}

export type StaticServer = {
  origin: string;
  close(): Promise<void>;
};

/** Serve the built site on an ephemeral port for the UI checks. */
export async function startStaticServer(): Promise<StaticServer> {
  const server = http.createServer((request, response) => {
    const assetPath = resolveDistAsset(request.url || "/");

    if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }

    response.setHeader(
      "Content-Type",
      MIME_TYPES.get(path.extname(assetPath)) || "application/octet-stream"
    );
    fs.createReadStream(assetPath).pipe(response);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not bind the local UI test server");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
