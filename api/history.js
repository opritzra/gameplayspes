const { put, list } = require("@vercel/blob");

const HISTORY_PREFIX = "history/";

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const latestHistory = await readLatestHistory();
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ history: latestHistory });
      return;
    }

    if (req.method === "POST") {
      const history = Array.isArray(req.body?.history) ? req.body.history : null;

      if (!history) {
        res.status(400).json({ error: "Invalid history payload." });
        return;
      }

      const pathname = `${HISTORY_PREFIX}history-${Date.now()}.txt`;
      await put(pathname, JSON.stringify(history), {
        access: "public",
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

  const response = await fetch(`${blobs[0].url}?v=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not download latest history file.");
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
}
