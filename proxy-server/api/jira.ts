import type { VercelRequest, VercelResponse } from "@vercel/node";
import https from "https";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function proxy(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? `/${path.join("/")}` : `/${path ?? ""}`;
  const qs = new URL(req.url ?? "", `http://${req.headers.host}`).search;
  const fullPath = `${targetPath}${qs}`;

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Atlassian-Token");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const headers: Record<string, string> = {
    "X-Atlassian-Token": "no-check",
  };
  if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"] as string;
  if (req.headers["accept"]) headers["accept"] = req.headers["accept"] as string;
  if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"] as string;

  const options = {
    hostname: "api.atlassian.com",
    port: 443,
    path: fullPath,
    method: req.method ?? "GET",
    headers,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode ?? 502);
    const ct = proxyRes.headers["content-type"];
    if (ct) res.setHeader("content-type", ct);
    proxyRes.on("data", (chunk: Buffer) => res.write(chunk));
    proxyRes.on("end", () => res.end());
  });

  proxyReq.on("error", (err) => {
    res.status(502).json({ error: err.message });
  });

  if (req.body) {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    proxyReq.write(body);
  }
  proxyReq.end();
}

export default proxy;
