const Sequelize = require('sequelize');
const fs = require('fs');

//Load Table models
const SenderPhonesModel = require('./table_SenderPhones');
const RecipientPhonesModel = require('./table_RecipientPhones');
const MessagesModel = require('./table_Messages');
const SendingStatusesModel = require('./table_SendingStatuses');


const cfg = JSON.parse(fs.readFileSync('./config/serverConfig.json'));
const dbConnect = new Sequelize(cfg.db.dbname, cfg.db.user, cfg.db.password, {
  host: cfg.db.host,
  dialect: cfg.db.type,
  logging: false,
  operatorsAliases: false,
  pool: {
    max: cfg.db.poolMax,
    min: cfg.db.poolMin,
    acquire: cfg.db.poolAcquire,
    idle: cfg.db.poolIdle
    },
  dialectOptions: {
        //useUTC: false, 
        dateStrings: true,
        typeCast: true
  },
  keepDefaultTimezone: true
});


const SenderPhones = SenderPhonesModel(dbConnect, Sequelize);
const RecipientPhones = RecipientPhonesModel(dbConnect, Sequelize);
const Messages = MessagesModel(dbConnect, Sequelize);
const SendingStatuses = SendingStatusesModel(dbConnect, Sequelize);

//hooks



//Lists



//data foreign keys



// export models
module.exports.SenderPhones = SenderPhones;
module.exports.RecipientPhones = RecipientPhones;
module.exports.Messages = Messages;
module.exports.SendingStatuses = SendingStatuses;
