const { isEditor } = require('./_lib');
module.exports = async (req, res) => { res.status(200).json({ editor: isEditor(req) }); };
