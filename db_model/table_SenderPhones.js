module.exports = (sequelize, type) => {
    return sequelize.define('senderphones', {
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
		UserName: {
            type: type.STRING(50),
            allowNull: false
        },
		Password: {
            type: type.STRING(50),
            allowNull: false
        },
		Token: {
            type: type.STRING(2048),
            allowNull: true
        },		
        FailCount: {
            type: type.INTEGER,
            allowNull: false
        },		
        Active: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        freezeTableName: true,
        timestamps: false
    });
};