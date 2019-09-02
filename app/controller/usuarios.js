const { tbl_usuarios, tbl_hierarquias, tbl_empresas, tbl_enderecos } = require('../models');
const util = require('./util');
const bcrypt = require('bcrypt');
const db = require('../models')

// Buscar todos os usuarios
const getAllUsuarios = (req, res, next) => {

  tbl_usuarios.findAll({
    attributes: { exclude: ['fk_usuario_endereco', 'fk_usuario_empresa', 'fk_usuario_hierarquia'] },
    include: [
      {
        attributes: ['razao_social', 'nome_fantasia', 'cnpj', 'segmento',],
        model: tbl_empresas,
        as: 'empresa'
      },
      {
        attributes: ['nome'],
        model: tbl_hierarquias,
        as: 'hierarquia'
      },
      {
        attributes: { exclude: ['createdAt', 'updatedAt', 'versaoLocal', 'id_endereco'] },
        model: tbl_enderecos,
        as: 'endereco'
      }
    ],
    where: { ativo: 1 }
  }).then((usuario) => {

    if ((usuario == null) || (usuario == undefined) || (usuario.length == 0)) {
      res.status(404)
        .send(util.response("Not Found", 404, usuario, "api/usuarios", "GET", null))
    }
    else {
      res.status(200)
        .send(util.response("Get Usuarios", 200, usuario, "api/usuarios", "GET", null))
    }
  }).catch((e) => {
    let error = console.error(e)
    res.status(400)
      .send(util.response("Error", 400, usuario, "api/usuarios", "GET", error))
  })
}

// Buscar o usuario com o id que for passado como parametro
const getOneUsuario = (req, res, next) => {

  tbl_usuarios.findAll({
    attributes: { exclude: ['fk_usuario_endereco', 'fk_usuario_empresa', 'fk_usuario_hierarquia'] },
    include: [
      {
        attributes: ['razao_social', 'nome_fantasia', 'cnpj', 'segmento',],
        model: tbl_empresas,
        as: 'empresa'
      },
      {
        attributes: ['nome'],
        model: tbl_hierarquias,
        as: 'hierarquia'
      },
      {
        attributes: { exclude: ['createdAt', 'updatedAt', 'versaoLocal', 'id_endereco'] },
        model: tbl_enderecos,
        as: 'endereco'
      }
    ],
    where: { id_usuario: req.params.id, ativo: 1 }
  }).then((usuario) => {

    if ((usuario == null) || (usuario == undefined) || (usuario.length == 0)) {
      res.status(404)
        .send(util.response("Not Found", 404, usuario, "api/usuarios", "GET", null))
    }
    else {
      res.status(200)
        .send(util.response("Get Usuario", 200, usuario, "api/usuarios", "GET", null))
    }
  }).catch((e) => {
    let error = console.error(e)
    res.status(400)
      .send(util.response("Error", 400, usuario, "api/usuarios", "GET", error))
  })
}

// Criar um novo usuario
const setUsuario = (req, res, next) => {
   tbl_usuarios.findAll({
    where: {
      [db.Sequelize.Op.or]: [
        { login: req.body.login },
        { email: req.body.email },
      ]
    }
  }).then((usuario) => {
    let error = []
    for(dados in usuario ){
      if (usuario[dados].login == req.body.login) {
        error.push(util.error("Error", "Este login já existe"))
      }
      else if(usuario[dados].email == req.body.email){
        error.push(util.error("Error", "Este email já existe"))
      }
    }
    if(error.length > 0){
      res.status(400).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/usuario", "POST", error))
    }else{
      tbl_usuarios.create(req.body)
        .then((usuario) => {
          res.status(201).send(util.response("Cadastrar usúario", 201, `usúario ${usuario.login} criado com sucesso`, "api/usuario", "POST", null))
        })
        .catch((e) => {
          let error = console.error(e)
          res.status(400).send(error)
        })
    }
  })
}

const modifyUsuario = (req, res, next) => {
  tbl_usuarios.update(req.body, {
    where: {
      id_usuario: req.params.id
    }
  })
  .then((usuarios) => {
    if(usuarios == 1){
      res.status(200).send(util.response("Sucesso", 200, "Alterado com sucesso", "api/usuario", "PATCH", null))
    }else{
      res.status(204).send(util.response("Sem alterações", 204, null, "api/usuario", "PATCH", null))
    }
  })
  .catch((e) => {
    let error = console.error(e)
    res.status(400).send(error)
  })
}


module.exports = {
  setUsuario,
  getAllUsuarios,
  getOneUsuario,
  modifyUsuario
}