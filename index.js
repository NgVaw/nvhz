
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 10000;
const TARGET = "http://103.129.126.85:8000";
const SOURCE = "http://103.129.126.85:8000";

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  xfwd: true,
  ws: true,
  selfHandleResponse: true,
  on: {
    proxyRes(proxyRes, req, res) {
      const contentType = proxyRes.headers["content-type"] || "";
      const status = proxyRes.statusCode || 200;

      if (status === 204 || status === 304 ||
          [301, 302, 303, 307, 308].includes(status)) {
        res.writeHead(status, proxyRes.headers);
        res.end();
        return;
      }

      const chunks = [];
      proxyRes.on("data", chunk => chunks.push(chunk));
      proxyRes.on("end", () => {
        let body = Buffer.concat(chunks);
        const headers = { ...proxyRes.headers };

        delete headers["content-length"];
        delete headers["content-encoding"];
        delete headers["transfer-encoding"];

        if (contentType.includes("text/html") ||
            contentType.includes("javascript") ||
            contentType.includes("application/json")) {
          let text = body.toString("utf8");
          const publicUrl = `${req.protocol}://${req.get("host")}`;

          text = text.split(SOURCE).join(publicUrl);
          text = text.split("https://103.129.126.85:5004")
                     .join(publicUrl);

          body = Buffer.from(text);
        }

        res.writeHead(status, headers);
        res.end(body);
      });
    },
    error(err, req, res) {
      console.error("Proxy error:", err.message);
      if (!res.headersSent) res.status(502);
      res.end("Backend VPS khong phan hoi");
    }
  }
}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy listening on port ${PORT}`);
});
