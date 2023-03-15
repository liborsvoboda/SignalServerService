module.exports = (sequelize, type) => {
    return sequelize.define('recipientphones', {
        Id: {
            type: type.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        PhoneNumber: {
            type: type.STRING(20),
            allowNull: false
        },
        Unavailable: {
            type: type.BOOLEAN,
            allowNull: true
        },	
        Unsubscribed: {
            type: type.BOOLEAN,
            allowNull: true
        }		
    }, {
        freezeTableName: true,
        timestamps: false
    });
};