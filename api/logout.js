const { cookieHeader } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
  res.status(200).json({ ok: true });
};
