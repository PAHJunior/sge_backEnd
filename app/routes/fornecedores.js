var express = require('express');
var router = express.Router();
const { buscarFornecedores } = require('../controller/fornecedores')

/* GET usuarios listing. */
router.get('/', buscarFornecedores);

module.exports = router;