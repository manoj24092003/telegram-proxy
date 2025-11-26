const express = require("express");
const https = require("https");

const app = express();

app.get("/", (req, res) => {
  res.send("Telegram Proxy Running ✔️");
});

app.get("/stream", (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send("Missing url param");

  const options = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Range": req.headers.range || "",
    },
    rejectUnauthorized: false, // <— IMPORTANT (Telegram SSL fix)
  };

  https.get(fileUrl, options, (tgRes) => {
    // If Telegram blocks or error
    if (tgRes.statusCode >= 400) {
      return res.status(500).send("Telegram Server Error");
    }

    res.writeHead(tgRes.statusCode, {
      "Content-Type": tgRes.headers["content-type"] || "video/mp4",
      "Content-Length": tgRes.headers["content-length"],
      "Accept-Ranges": "bytes",
      ...(tgRes.headers["content-range"]
        ? { "Content-Range": tgRes.headers["content-range"] }
        : {}),
    });

    tgRes.pipe(res);
  }).on("error", (err) => {
    console.log("ERROR:", err.message);
    res.status(500).send("Proxy Error");
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("Proxy running on port", PORT)
);
