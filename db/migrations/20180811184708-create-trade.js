'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('trades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user: {
        allowNull: false,
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
          as: 'user',
        },
      },
      duration: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      earning: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 2)
      },
      dailyEarning: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 2)
      },
      totalEarnings: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      endingTime: {
        allowNull: true,
        type: Sequelize.STRING
      },
      earningStart: {
        allowNull: true,
        type: Sequelize.STRING
      },
      investing: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 2)
      },
      status: {
        allowNull: false,
        type: Sequelize.TINYINT,
        defaultValue: 0 // 0 for not paid, 1 for ongoing, 2 for completed
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('trades');
  }
};
