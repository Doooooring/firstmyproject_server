'use strict'
const firstData = require('../contents.json')
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('news', firstData, {})
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('news', null, {})
  },
}
