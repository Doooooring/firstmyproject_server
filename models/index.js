const Sequelize = require('sequelize')
const { isModuleNamespaceObject } = require('util/types')
const config = require('../config/config.json')

const { username, password, database, host, dialect } = config.development
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
})

const News = require('./news.js')(sequelize, Sequelize.DataTypes)
const db = {}
db.News = News
module.exports = db
