var express = require('express');
var router = express.Router();
const {
    verificarToken
} = require('../controller/util/index.js')

// Validar token, retorna true ou false...
router.get('/:id/:token', verificarToken);

module.exports = router;
