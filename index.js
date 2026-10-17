
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 10000;
const TARGET = "http://103.129.126.85:5004";

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  xfwd: true,
  ws: true,
  proxyTimeout: 30000,
  timeout: 35000,
  on: {
    error(err, req, res) {
      console.error("Proxy error:", err.message);
      if (res && !res.headersSent) {
        res.writeHead(502, {
          "Content-Type": "text/plain; charset=utf-8"
        });
      }
      if (res && !res.writableEnded) {
        res.end("Backend VPS khong phan hoi");
      }
    }
  }
}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy listening on port ${PORT}`);
});
  
