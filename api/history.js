const { put, list, head, download } = require("@vercel/blob");

const HISTORY_PREFIX = "history/";

module.exports = async function handler(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({
        error: "Vercel Blob nao configurado.",
        details: "Defina BLOB_READ_WRITE_TOKEN no projeto da Vercel e conecte um Blob Store.",
      });
      return;
    }

    if (req.method === "GET") {
      const latestHistory = await readLatestHistory();
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ history: latestHistory });
      return;
    }

    if (req.method === "POST") {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const history = Array.isArray(payload?.history) ? payload.history : null;

      if (!history) {
        res.status(400).json({ error: "Invalid history payload." });
        return;
      }

      const pathname = `${HISTORY_PREFIX}history-${Date.now()}.txt`;
      await put(pathname, JSON.stringify(history), {
        access: "private",
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });

      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(500).json({
      error: "Failed to access history storage.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

async function readLatestHistory() {
  const result = await list({ prefix: HISTORY_PREFIX, limit: 1000 });
  const blobs = [...result.blobs].sort((a, b) => {
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  if (blobs.length === 0) {
    return [];
  }

  const latestPathname = blobs[0].pathname || await resolvePathnameFromUrl(blobs[0].url);
  const blob = await download(latestPathname);
  const raw = await blob.text();
  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
}

async function resolvePathnameFromUrl(url) {
  const metadata = await head(url);
  if (!metadata?.pathname) {
    throw new Error("Could not resolve blob pathname.");
  }

  return metadata.pathname;
}
