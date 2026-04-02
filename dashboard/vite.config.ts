import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";
import https from "https";

function jiraProxyPlugin(env: Record<string, string>): Plugin {
  const email = env.VITE_JIRA_EMAIL ?? "";
  const token = env.VITE_JIRA_API_TOKEN ?? "";
  const imgAuth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

  return {
    name: "jira-server-proxy",
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url) { next(); return; }

        const isImg = req.url.startsWith("/jira-img/");
        const isApi = req.url.startsWith("/jira-api/");
        if (!isImg && !isApi) { next(); return; }

        const prefix = isImg ? "/jira-img" : "/jira-api";
        const targetPath = req.url.replace(new RegExp(`^${prefix}`), "");
        const targetUrl = new URL(targetPath, "https://api.atlassian.com");

        const proxyHeaders: Record<string, string> = {
          "X-Atlassian-Token": "no-check",
        };

        if (isImg) {
          proxyHeaders["authorization"] = imgAuth;
          proxyHeaders["accept"] = "application/json, */*";
        } else {
          if (req.headers["authorization"])
            proxyHeaders["authorization"] = req.headers["authorization"] as string;
          if (req.headers["accept"])
            proxyHeaders["accept"] = req.headers["accept"] as string;
          if (req.headers["content-type"])
            proxyHeaders["content-type"] = req.headers["content-type"] as string;
          if (req.headers["content-length"])
            proxyHeaders["content-length"] = req.headers["content-length"] as string;
          if (req.headers["transfer-encoding"])
            proxyHeaders["transfer-encoding"] = req.headers["transfer-encoding"] as string;
        }

        const options = {
          hostname: targetUrl.hostname,
          port: 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method ?? "GET",
          headers: proxyHeaders,
        };

        const makeRequest = (reqOptions: typeof options) => {
          const proxyReq = https.request(reqOptions, (proxyRes) => {
            const status = proxyRes.statusCode ?? 502;
            if (isImg && status >= 300 && status < 400 && proxyRes.headers.location) {
              const redir = new URL(proxyRes.headers.location);
              proxyRes.resume();
              const redirReq = makeRequest({
                hostname: redir.hostname,
                port: 443,
                path: redir.pathname + redir.search,
                method: "GET",
                headers: { accept: "*/*" },
              });
              redirReq.end();
              return;
            }
            const headers: Record<string, string> = {
              "content-type": proxyRes.headers["content-type"] ?? "application/octet-stream",
            };
            if (isImg) headers["cache-control"] = "public, max-age=86400";
            res.writeHead(status, headers);
            proxyRes.pipe(res);
          });

          proxyReq.on("error", (err) => {
            console.error("[jira-proxy] request error:", err.message);
            if (!res.headersSent) {
              res.writeHead(502, { "content-type": "application/json" });
            }
            res.end(JSON.stringify({ error: err.message }));
          });

          return proxyReq;
        };

        const proxyReq = makeRequest(options);
        req.pipe(proxyReq);
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    base: command === "build" ? "/JiraProjectKendra/" : "/",
    plugins: [react(), jiraProxyPlugin(env)],
    server: {
      port: 5174,
      strictPort: true,
    },
  };
});
