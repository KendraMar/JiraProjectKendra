import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";
import https from "https";

function jiraProxyPlugin(): Plugin {
  return {
    name: "jira-server-proxy",
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url || !req.url.startsWith("/jira-api/")) {
          next();
          return;
        }

        const targetPath = req.url.replace(/^\/jira-api/, "");
        const targetUrl = new URL(targetPath, "https://api.atlassian.com");

        const proxyHeaders: Record<string, string> = {
          "X-Atlassian-Token": "no-check",
        };
        if (req.headers["authorization"])
          proxyHeaders["authorization"] = req.headers["authorization"] as string;
        if (req.headers["accept"])
          proxyHeaders["accept"] = req.headers["accept"] as string;
        if (req.headers["content-type"])
          proxyHeaders["content-type"] = req.headers["content-type"] as string;

        const options = {
          hostname: targetUrl.hostname,
          port: 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method ?? "GET",
          headers: proxyHeaders,
        };

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, {
            "content-type": proxyRes.headers["content-type"] ?? "application/json",
          });
          proxyRes.pipe(res);
        });

        proxyReq.on("error", (err) => {
          console.error("[jira-proxy] request error:", err.message);
          res.writeHead(502, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        });

        req.pipe(proxyReq);
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/JiraProjectKendra/" : "/",
  plugins: [react(), jiraProxyPlugin()],
}));
