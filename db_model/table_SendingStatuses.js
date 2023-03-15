module.exports = (sequelize, type) => {
    return sequelize.define('sendingstatuses', {
        Id: {
            type: type.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        MessageId: {
            type: type.INTEGER,
            allowNull: false
        },
        SenderId: {
            type: type.INTEGER,
            allowNull: false
        },
        RecipientId: {
            type: type.INTEGER,
            allowNull: false
        },
        Sended: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },		
		ErrorMessage: {
            type: type.STRING(2048),
            allowNull: true
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });
};