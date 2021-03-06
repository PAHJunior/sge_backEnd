const {
  tbl_produtos,
  tbl_unid_medidas,
  tbl_categoria_produtos,
  tbl_grupo_produtos,
  tbl_fornecedores,
  tbl_estoques
} = require('../models');
const logs = require('./logs')
const util = require('./util');
const db = require('../models')

const buscarProdutos = (req, res, next) => {
  tbl_produtos.findAll({
    attributes: {
      exclude: ['versaoLocal']
    },
    include: [{
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_unid_medidas,
      as: 'unidade_medida'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_categoria_produtos,
      as: 'categoria'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_grupo_produtos,
      as: 'grupo'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_fornecedores,
      as: 'fornecedor'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_estoques,
      as: 'estoque'
    }]
  })
    .then((unid_medidas) => {
      if ((unid_medidas == null) || (unid_medidas == undefined) || (unid_medidas.length == 0)) {
        res.status(200)
          .send(util.response("Erro", 404, "Os produtos não foram encontrados", "api/produtos", "GET", null))
      } else {
        res.status(200)
          .send(util.response("Buscar produtos", 200, unid_medidas, "api/produtos", "GET", null))
      }
    }).catch((e) => {
      let msg_erro = []
      for (e in error.errors) {
        // adicionando o json ao array de erros
        msg_erro.push(util.msg_error("Ocorreu um erro",
          error.errors[e].message,
          error.errors[e].value,
          error.errors[e].type,
          error.errors[e].validatorKey))
      }
      res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "GET", msg_erro))
    })
}

const buscarUmProdutos = (req, res, next) => {
  tbl_produtos.findAll({
    
    attributes: {
      exclude: ['versaoLocal']
    },
    include: [{
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_unid_medidas,
      as: 'unidade_medida'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_categoria_produtos,
      as: 'categoria'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_grupo_produtos,
      as: 'grupo'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_fornecedores,
      as: 'fornecedor'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_estoques,
      as: 'estoque'
    }],
    where: {
      id_produto: req.params.id
    }
  })
    .then((unid_medidas) => {
      if ((unid_medidas == null) || (unid_medidas == undefined) || (unid_medidas.length == 0)) {
        res.status(200)
          .send(util.response("Erro", 404, "Produto não encontrado", "api/produtos", "GET", null))
      } else {
        res.status(200)
          .send(util.response("Buscar produto", 200, unid_medidas, "api/produtos", "GET", null))
      }
    }).catch((e) => {
      let msg_erro = []
      for (e in error.errors) {
        // adicionando o json ao array de erros
        msg_erro.push(util.msg_error("Ocorreu um erro",
          error.errors[e].message,
          error.errors[e].value,
          error.errors[e].type,
          error.errors[e].validatorKey))
      }
      res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "GET", msg_erro))
    })
}

const criarProduto = (req, res, next) => {
  return db.sequelize.transaction((t) => {
    return tbl_produtos.create(req.body, {
      transaction: t
    })
  })
    .then((result) => {
      logs.insertLog(req.body.loglogin, 'insert', 'produtos', `${req.body.loglogin} cadastrou um novo produto - ${result.nome_produto}`)
      res.status(201).send(util.response("Cadastrar produto", 201, `Produto ${result.nome_produto} criado com sucesso`, "api/produtos", "POST"))
    })
    .catch((error) => {
      console.log(error)
      let msg_erro = []
      for (e in error.errors) {
        msg_erro.push(util.msg_error("Ocorreu um erro",
          error.errors[e].message,
          error.errors[e].value,
          error.errors[e].type,
          error.errors[e].validatorKey))
      }
      res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "POST", msg_erro))
    })
}

const modificarProduto = async (req, res, next) => {
  // Buscando o estoque pelo id
  const produto = await tbl_produtos.findByPk(req.params.id)

  try {

    if (produto !== null) {
      // adicionando a versão local ao corpo da requisição
      req.body['versaoLocal'] = produto.versaoLocal
      // enviando a requisição de atualização
      tbl_produtos.update(req.body, {
        where: {
          id_produto: req.params.id
        }
      })
        .then((produto) => {
          // se o retorno for 1, sucesso
          if (produto == 1) {
            logs.insertLog(req.body.loglogin, 'update', 'produtos', `${req.body.loglogin} alterou o produto - ${produto.nome_produto}`)
            res.status(200).send(util.response("Sucesso", 200, "Alterado com sucesso", "api/produtos", "PATCH", null))
          } else {
            res.status(204).send(util.response("Sem alterações", 204, null, "api/produtos", "PATCH", null))
          }
        })
        .catch((error) => {
          // variavel que contem um array de erros
          let msg_erro = []
          for (e in error.errors) {
            // adicionando o json ao array de erros
            msg_erro.push(util.msg_error("Ocorreu um erro",
              error.errors[e].message,
              error.errors[e].value,
              error.errors[e].type,
              error.errors[e].validatorKey))
          }
          res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "PATCH", msg_erro))
        })
    } else {
      res.status(200).send(util.response("Erros", 404, `Usúario não foi encontrado`, "api/produtos", "PATCH", null))
    }
  } catch (error) {
    let msg_erro = []
    msg_erro.push(util.msg_error(
      "Ocorreu um erro",
      error,
      null,
      null,
      null))
    res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "PATCH", msg_erro))
  }
}

const buscarProdutoEstoque = (req, res, next) => {
  tbl_produtos.findAll({
    attributes: {
      exclude: ['versaoLocal']
    },
    include: [{
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_unid_medidas,
      as: 'unidade_medida'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_categoria_produtos,
      as: 'categoria'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_grupo_produtos,
      as: 'grupo'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_fornecedores,
      as: 'fornecedor'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_estoques,
      as: 'estoque'
    }],
    where: {
      fk_produto_estoque: req.params.estoque
    }
  })
    .then((unid_medidas) => {
      if ((unid_medidas == null) || (unid_medidas == undefined) || (unid_medidas.length == 0)) {
        res.status(200)
          .send(util.response("Erro", 404, "Os produtos não foram encontrados", "api/produtos", "GET", null))
      } else {
        res.status(200)
          .send(util.response("Buscar produtos", 200, unid_medidas, "api/produtos", "GET", null))
      }
    }).catch((e) => {
      let msg_erro = []
      for (e in error.errors) {
        // adicionando o json ao array de erros
        msg_erro.push(util.msg_error("Ocorreu um erro",
          error.errors[e].message,
          error.errors[e].value,
          error.errors[e].type,
          error.errors[e].validatorKey))
      }
      res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/produtos", "GET", msg_erro))
    })
}

module.exports = {
  buscarProdutos,
  buscarUmProdutos,
  criarProduto,
  modificarProduto,
  buscarProdutoEstoque
}