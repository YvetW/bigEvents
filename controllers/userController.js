const { User } = require("../db")
// 导入配置
const config = require('../config/index')
// 引入jwt token工具
const JwtUtil = require('../utils/jwt');

// 导入fs
const fs = require("fs")
const path = require("path")

const serverError = res => {
  res.status(500).send({
    code: 500,
    msg: "服务器内部错误"
  })
}

module.exports = {
  // 用户注册
  async register(req, res) {
    const { username, nickname, email, password } = req.body
    try {
      let userRes = await User.findOne({
        where: {
          username
        }
      })
      if (userRes != null) {
        return res.send({
          code: 400,
          msg: "用户已经注册"
        })
      }
      let createOpt = { username, nickname, email, password }
      let uerToRes = await User.create(createOpt)
      if (uerToRes == null) {
        return res.send({
          code: 500,
          msg: "注册失败"
        })
      }

      // 注册成功，添加token验证
      let jwt = new JwtUtil(username);
      let token = jwt.generateToken();

      res.send({
        code: 200,
        msg: "注册成功",
        token
      })
    } catch (error) {
      // console.log(error)
      serverError(res)
    }
  },
  async login(req, res) {
    const { username, password } = req.body
    try {
      let userRes = await User.findOne({
        where: {
          username: username,
          password: password
        }
      })
      if (userRes == null) {
        return res.status(403).send({
          code: 403,
          msg: "用户不存在或者密码错误"
        }).end()
      }

      // 注册成功，添加token验证
      let jwt = new JwtUtil(username);
      let token = jwt.generateToken();

      return res.send({
        code: 200,
        msg: "注册成功",
        token
      }).end()
    } catch (error) {
      // console.log(error)
      serverError(res)
    }
  },
  // 用户退出
  logout(req, res) {
    res.send({
      code: 200,
      msg: "退出成功"
    })
  },
  // 获取用户信息
  async info(req, res) {
    let token = req.header('authorization');
    let username = new JwtUtil(token).getUsername()
    try {
      let userRes = await User.findOne({
        where: {
          username: username
        },
        attributes: ["nickname", "userPic"]
      })
      userRes = JSON.parse(JSON.stringify(userRes))
      userRes.userPic = `${config.baseUrl}:${config.port}/${userRes.userPic}`
      res.send({
        code: 200,
        msg: "获取成功",
        data: userRes
      })
    } catch (error) {
      serverError(res)
    }
  },
  // 获取用户详情
  async detail(req, res) {
    try {
      let token = req.header('authorization');
      let username = new JwtUtil(token).getUsername()
      let userRes = await User.findOne({
        where: {
          username: username
        },
        attributes: ["nickname", "userPic", "email", "password", "username"]
      })
      userRes = JSON.parse(JSON.stringify(userRes))
      userRes.userPic = `${config.baseUrl}:${config.port}/${userRes.userPic}`
      res.send({
        code: 200,
        msg: "获取成功",
        data: userRes
      })
    } catch (error) {
      serverError(res)
    }
  },
  // 编辑用户信息
  async edit(req, res) {
    // 获取信息
    const { username, nickname, email, password } = req.body
    let updateOpt = { username, nickname, email, password }
    try {
      let token = req.header('authorization');
      let username = new JwtUtil(token).getUsername()
      let userRes = {}
      // 获取图片
      if (req.file) {
        // 获取封面
        const { filename: userPic } = req.file
        updateOpt["userPic"] = userPic
        // 删除之前的那个图片
        userRes = await User.findOne({
          where: {
            username: username
          }
        })
      }
      // 更新数据

      const updateRes = await User.update(updateOpt, {
        where: {
          id: 1
        }
      })

      res.send({
        code: 200,
        msg: "更新成功"
      })
      // 删除文件
      fs.unlinkSync(path.join(__dirname, "../uploads/", userRes.userPic))
    } catch (error) {
      // console.log(error)
      serverError(res)
    }
  }
}
