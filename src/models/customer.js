module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'first_name',
        validate: {
          notEmpty: { msg: 'İsim alanı boş bırakılamaz.' }
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'last_name'
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Bu e-posta adresi zaten kayıtlı.'
        },
        validate: {
          isEmail: { msg: 'Geçerli bir e-posta adresi giriniz.' }
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'password_hash'
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('customer', 'admin'),
        defaultValue: 'customer',
        allowNull: false
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'customers',
      underscored: true,
      timestamps: true
    }
  );

  return Customer;
};
