const {
  tbl_usuarios,
  tbl_hierarquias,
  tbl_empresas,
  tbl_enderecos,
  tbl_notificacoes
} = require('../models');
const util = require('./util');
const bcrypt = require('bcrypt');
const db = require('../models')
const logs = require('./logs')

// Buscar todos os usuarios
const buscarTodosUsuarios = (req, res, next) => {
  let error = []
  tbl_usuarios.findAll({
    attributes: {
      exclude: ['senha']
    },
    include: [{
      attributes: ['razao_social', 'nome_fantasia', 'cnpj', 'segmento', 'id_empresa'],
      model: tbl_empresas,
      as: 'empresa'
    },
    {
      attributes: ['nome', 'id_hierarquia'],
      model: tbl_hierarquias,
      as: 'hierarquia'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_enderecos,
      as: 'endereco'
    }
    ]
  }).then((usuario) => {
    if ((usuario == null) || (usuario == undefined) || (usuario.length == 0)) {
      error.push(util.msg_error("Erro", "Usúario não encontrado", req.body.senha, null, null, 404))
    }
    else if (error.length > 0) {
      res.status(200).send(util.response(
        "Erro",
        404,
        "Usúario não encontrado",
        "api/usuarios", "GET",
        error.push(util.msg_error("Erro", "Usúario não encontrado", req.body.senha, null, null, 404))
      ))
    }
    else {
      res.status(200).send(util.response("Get Usuarios", 200, usuario, "api/usuarios", "GET", null))
    }
  }).catch((e) => {
    let error = console.error(e)
    res.status(400)
      .send(util.response("Error", 400, 'Ocorreu um error ao buscar os usuarios', "api/usuarios", "GET", error))
  })
}

// Buscar o usuario com o id que for passado como parametro
const buscarUmUsuario = (req, res, next) => {

  tbl_usuarios.findAll({
    attributes: {
      exclude: ['senha']
    },
    include: [{
      attributes: ['razao_social', 'nome_fantasia', 'cnpj', 'segmento', 'id_empresa'],
      model: tbl_empresas,
      as: 'empresa'
    },
    {
      attributes: ['nome', 'id_hierarquia'],
      model: tbl_hierarquias,
      as: 'hierarquia'
    },
    {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'versaoLocal']
      },
      model: tbl_enderecos,
      as: 'endereco'
    }
    ],
    where: {
      id_usuario: req.params.id
    }
  }).then((usuario) => {

    if ((usuario == null) || (usuario == undefined) || (usuario.length == 0)) {
      res.status(404)
        .send(util.response("Not Found", 404, usuario, "api/usuarios", "GET", null))
    } else {
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
const criarUsuario = (req, res, next) => {
  // Separando os dados de endereco, empresa e hierarquia
  const endereco = req.body.endereco;

  return db.sequelize.transaction((t) => {
    return tbl_enderecos.create(endereco, {
      transaction: t
    })
    .then((endereco) => {
        logs.insertLog(req.body.loglogin, 'insert', 'usuarios', `${req.body.loglogin} cadastrou uma novo endereco #(ID) ${endereco.id_endereco}`)
        let usuario = {
          nome: req.body.nome,
          rg: req.body.rg,
          cpf: req.body.cpf,
          dt_nascimento: util.data_yyymmdd(req.body.dt_nascimento),
          telefone: req.body.telefone,
          celular: req.body.celular,
          email: req.body.email,
          login: req.body.login,
          senha: req.body.senha,
          fk_usuario_empresa: req.body.fk_usuario_empresa,
          fk_usuario_hierarquia: req.body.fk_usuario_hierarquia,
          fk_usuario_endereco: endereco.id_endereco
        }

        return tbl_usuarios.create(usuario, {
          transaction: t
        })
          .then((notificacao) => {
            let notify = {
              fk_usuario: notificacao.id_usuario,
              descricao: `Olá ${notificacao.nome} seja bem vindo(a) ao Sistema SGE`
            }
            return tbl_notificacoes.create(notify, {
              transaction: t
            })
          })
      })
  })
    .then(async (result) => {
      const usuario = await tbl_usuarios.findByPk(result.fk_usuario)
      logs.insertLog(req.body.loglogin, 'insert', 'usuarios', `${req.body.loglogin} cadastrou uma novo usuario #(nome) ${usuario.login}`)
      res.status(201).send(util.response("Cadastrar usúario", 201, `usúario ${usuario.login} criado com sucesso`, "api/usuario", "POST"))
    })
    .catch((error) => {
      let msg_erro = []
      for (e in error.errors) {
        msg_erro.push(util.msg_error("Ocorreu um erro",
          error.errors[e].message,
          error.errors[e].value,
          error.errors[e].type,
          error.errors[e].validatorKey))
      }
      res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/usuario", "POST", msg_erro))
    })
}


const modificarUsuario = async (req, res, next) => {

  try {
    const usuario = await tbl_usuarios.findByPk(req.params.id)
    let alterEndereco = await tbl_enderecos.update(req.body.endereco, {
      where: {
        id_endereco: usuario.fk_usuario_endereco
      }
    })

    let bodyUsuario = {
      nome: req.body.nome,
      rg: req.body.rg,
      cpf: req.body.cpf,
      dt_nascimento: util.data_yyymmdd(req.body.dt_nascimento),
      telefone: req.body.telefone,
      celular: req.body.celular,
      email: req.body.email,
      login: req.body.login,
      senha: req.body.senha,
      fk_usuario_empresa: req.body.fk_usuario_empresa,
      fk_usuario_hierarquia: req.body.fk_usuario_hierarquia
    }
    let alterUser = await tbl_usuarios.update(bodyUsuario, {
      where: {
        id_usuario: req.params.id
      }
    })

    if ((alterUser == 1) && (alterEndereco == 1)) {
      logs.insertLog(req.body.loglogin, 'update', 'usuarios', `${req.body.loglogin} modificou o usuario ${req.body.nome}`)
      return res.status(200).send(util.response("Sucesso", 200, "Alterado com sucesso", "api/usuario", "PATCH", null))
    }
    else {
      return res.status(204).send(util.response("Sem alterações", 204, null, "api/usuario", "PATCH", null))
    }
  } catch (error) {
    console.error(error)
    let msg_erro = []
    msg_erro.push(util.msg_error(
      "Ocorreu um erro",
      error,
      null,
      null,
      null))
    res.status(400).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/usuario", "PATCH", msg_erro))
  }
}

const loginUsuario = async (req, res, next) => {
  let error = []
  const usuario = await tbl_usuarios.findOne({
    include: [
      {
        attributes: ['razao_social', 'nome_fantasia', 'cnpj', 'segmento', 'id_empresa'],
        model: tbl_empresas,
        as: 'empresa'
      },
      {
        attributes: ['id_hierarquia', 'nome'],
        model: tbl_hierarquias,
        as: 'hierarquia'
      }
    ],
    where: {
      login: req.body.login,
      ativo: true
    }
  })
  if ((!usuario) || (usuario == null) || (usuario == undefined) || (usuario.login !== req.body.login)) {
    error.push(util.msg_error("Erro", "Usuário não encontrado", req.body.login, null, null))
  }
  else if (!await bcrypt.compare(req.body.senha, usuario.senha)) {
    req.session.isLogado = false
    req.session.usuario = false
    error.push(util.msg_error("Erro", "Senha inválida", req.body.senha, null, null))
  }

  if (error.length > 0) {
    return res.status(200).send(util.response("Erro", 400, "Encontramos alguns erros", "api/usuario/login", "POST", error))
  }
  else {
    req.session.isLogado = true
    req.session.user = usuario
    const user = {
      token: await util.generateToken({ id: usuario.id_usuario }),
      isLogado: true,
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      login: usuario.login,
      empresa: {
        id_empresa: usuario.empresa.id_empresa,
        nome_fantasia: usuario.empresa.nome_fantasia,
        razao_social: usuario.empresa.razao_social,
        cnpj: usuario.empresa.cnpj
      },
      hierarquia: {
        id_hierarquia: usuario.hierarquia.id_hierarquia,
        nome: usuario.hierarquia.nome
      }
    }
    return res.status(200).send(util.response("Login", 200, user, "api/usuario/login", "POST", null))
  }
}

const modificarSenha = async (req, res, next) => {

  try {
    let alterSenha = await tbl_usuarios.update(req.body, {
      where: {
        id_usuario: req.params.id
      }
    })

    if (alterSenha == 1) {
      logs.insertLog(req.body.loglogin, 'update', 'usuarios', `Senha do usuario ${req.body.loglogin} modificou o usuario ${req.body.nome}`)
      return res.status(200).send(util.response("Sucesso", 200, "Senha alterada com sucesso", "api/usuario", "PATCH", null))
    }
    else {
      return res.status(204).send(util.response("Sem alterações", 204, null, "api/usuario", "PATCH", null))
    }
  } catch (error) {
    console.error(error)
    res.status(200).send(util.response("Erros", 400, `Encontramos alguns erros`, "api/usuario", "PATCH", error[0].message))
  }
}

module.exports = {
  criarUsuario,
  buscarTodosUsuarios,
  buscarUmUsuario,
  modificarUsuario,
  loginUsuario,
  modificarSenha
}