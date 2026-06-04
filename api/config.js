module.exports = function handler(req, res) {
  res.json({ hasApiKey: !!process.env.ANTHROPIC_API_KEY });
};
