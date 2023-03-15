module.exports = (sequelize, type) => {
    return sequelize.define('messages', {
        Id: {
            type: type.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        Subject: {
            type: type.STRING(50),
            allowNull: false
        },
		Message: {
            type: type.STRING(2048),
            allowNull: false
        },
        Sended: {
            type: type.BOOLEAN,
            allowNull: false
        }		
    }, {
        freezeTableName: true,
        timestamps: false
    });
};