'use strict';
module.exports = (sequelize, DataTypes) => {
  var Refferal = sequelize.define('Refferal', {
    referral: {
      tallowNull: false,
      type: DataTypes.INTEGER,
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id',
        as: 'referral',
      },
    },
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
    firstTransaction: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0
    }
  }, {});
  Refferal.associate = function(models) {
    Refferal.belongsTo(models.User, {
      foreignKey: 'user',
      onDelete: 'CASCADE',
      as: 'User'
    });
    Refferal.belongsTo(models.User, {
      foreignKey: 'referral',
      onDelete: 'CASCADE',
      as: 'Referral'
    })
  };
  return Refferal;
};
