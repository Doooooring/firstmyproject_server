'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class news extends Model {}
  news.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      title: DataTypes.STRING,
      subtitle: DataTypes.STRING,
      term: DataTypes.DATE,
      state: DataTypes.STRING,
      key: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'news',
    },
  )
  return news
}
