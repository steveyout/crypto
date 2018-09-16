'use strict';
module.exports = (sequelize, DataTypes) => {
  var Payments = sequelize.define('Payments', {
    user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id',
        as: 'user',
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    transaction: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    payed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {});
  Payments.associate = function(models) {
    Payments.belongsTo(models.User, {
      foreignKey: 'user',
      onDelete: 'CASCADE',
    });
  };
  return Payments;
};
