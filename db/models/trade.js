'use strict';
module.exports = (sequelize, DataTypes) => {
  var Trade = sequelize.define('Trade', {
    user: {
      allowNull: false,
      type: DataTypes.INTEGER,
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id',
        as: 'user',
      },
    },
    duration: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    earning: {
      allowNull: false,
      type: DataTypes.DECIMAL(15, 2)
    },
    dailyEarning: {
      allowNull: false,
      type: DataTypes.DECIMAL(15, 2)
    },
    totalEarnings: {
      allowNull: false,
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    endingTime: {
      allowNull: true,
      type: DataTypes.STRING
    },
    earningStart: {
      allowNull: true,
      type: DataTypes.STRING
    },
    investing: {
      allowNull: false,
      type: DataTypes.DECIMAL(15, 2)
    },
    status: {
      allowNull: false,
      type: DataTypes.TINYINT,
      defaultValue: 0 // 0 for not paid, 1 for ongoing, 2 for completed
    }
  }, {});
  Trade.associate = function(models) {
    Trade.belongsTo(models.User, {
      foreignKey: 'user',
      onDelete: 'CASCADE',
    });
  };
  return Trade;
};
