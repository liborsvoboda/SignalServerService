"use strict";
const fs = require('fs');
const path = require('path');
const ByteBuffer = require('bytebuffer');
const moment = require('moment');
const Sequelize = require('sequelize');
const { Op } = require("sequelize");


//initialize SignalStorage
const ChatRoom = "Main";
const Signal = require('./src/index');
const Storage = require('./src/LocalSignalProtocolStore');
const protocolStore = new Signal.ProtocolStore(new Storage(ChatRoom));
protocolStore.load(); 



//Load DB model
const db = require('./db_model/db_model');



//Start Initialize
const ServerCfg = JSON.parse(fs.readFileSync(path.join('./config/serverConfig.json'), 'utf8'));


//Db connect
const dbConnect = new Sequelize(ServerCfg.db.dbname, ServerCfg.db.user, ServerCfg.db.password, {
    host: ServerCfg.db.host,
    dialect: ServerCfg.db.type,
    logging: false,
    operatorsAliases: false,
    pool: {
        max: ServerCfg.db.poolMax,
        min: ServerCfg.db.poolMin,
        acquire: ServerCfg.db.poolAcquire,
        idle: ServerCfg.db.poolIdle
    },
    keepDefaultTimezone: true,
    dialectOptions: {
//        useUTC: false, 
        dateStrings: true,
        typeCast: true
    },
});


////Initiate variables
//var ServerData = ServerCfg.ServerDataModel;
//ServerData.Controller = setInterval(function () { CheckStatus(); }, (ServerData.Config.CheckNewMessageIntervalSec * 1000));

//END Initialize



//DB Task Example previous server start
	/*
	sequelize.query(
		'PURGE BINARY LOGS BEFORE NOW() - INTERVAL 5 MINUTE;'
	).then(res => {
		return null;
	}).catch(err => {
		return null;
	});
	*/


//Server Operations
function ServerOperations() {
	switch (ServerData.Data.Operation) {
		case 0: 
			ServerData.Data.OperationRunning = true;
			LoadNewMessages(ServerData).then(res => { ServerData = res; });
			console.log(getDateNow(), "Mes", ServerData.Data.MessagesForSend);

			//check and load refreshed phones data for new sending
			if (ServerData.Data.MessagesForSend.length > 0 && ServerData.Data.DbStatusOk) {
				LoadSenderPhones(ServerData).then(res => { ServerData.Data.DbStatusOk = res; });
				LoadRecipientPhones(ServerData).then(res => { ServerData.Data.DbStatusOk = res; });

				console.log("Data", ServerData);
				ServerData.Data.Waiting = false;
			} else { ServerData.Data.Waiting = true; }

			ServerData.Data.NextMessageCheck = new Date().getTime() + (ServerData.Config.CheckNewMessageIntervalSec * 1000);

			ServerData.Data.OperationRunning = false; NextOperation(true);
			break;


		case 20: // Save Message Status after sent
			ServerData.Data.OperationRunning = true;
			SaveSendingStatus().then(res => { ServerData.Data.DbStatusOk = res; });

			ServerData.Data.OperationRunning = false; NextOperation(true);
			break;

		case 100: // Remove Recipient from List
			ServerData.Data.OperationRunning = true;

			ServerData.Data.RecipientPhones.shift();

			// remove message from list
			if (ServerData.Data.RecipientPhones.length == 0) {
				ServerData.Data.MessagesForSend.shift();
			}

			ServerData.Data.OperationRunning = false; NextOperation(true);
		default:
		// code block
	}
}






//Start Server
var ServerData = ServerCfg.Server;
console.log(getDateNow(), "servers Starting " + new Date(), '\n');
ServerData.Controller = setInterval(function () { NextOperation(false); }, (ServerData.Config.CheckNewMessageIntervalSec * 1000));
NextOperation(false);




// Additional Functions


// Central Operation with checkers
function NextOperation(next) {
	console.log("Operation controller", ServerData.Data.Operation, ServerData.Data.MessagesForSend);


	if (ServerData.Data.OperationRunning) {
		return;
	} else if (!ServerData.Data.DbStatusOk) {
		CheckDbConnection().then(res => { ServerData.Data.DbStatusOk = res; });
	}


	if (!ServerData.Data.DbStatusOk || ServerData.Data.OperationRunning) return;

	//Go to Next Operation
	if (next) { ServerData.Data.Operation += 10; }
	if (ServerData.Data.Operation <= 100) { ServerOperations(); } else { ServerData.Data.Operation = 0; }
}




//System Funtions

//Run System Proccess Example
const child_process = require("child_process")
function SystemSync(cmd, port) {
    child_process.exec(cmd, (err, stdout, stderr) => {
        //console.log('stdout is:' + stdout)
        console.log('firevall port ' + port + ' result is: ' + stderr, '\n')
        //console.log('error is:' + err)
    }).on('exit', code => console.log('firewall result', code, '\n'))
}

function getDateNow() {
	let today = new Date();
	let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	let dateTime = date + ' ' + time;
	return dateTime;
}



// ---------------------------------------------
// Database functions
function CheckDbConnection() {
	if (!ServerData.Data.DbStatusOk) {
		return new Promise((resolve, reject) => {	
			return db.SenderPhones.findOne(
			).then(check => {
				resolve(true);
			}).catch(err => {
				console.log(err);
				resolve(false);
			});
		});
	}
}

function LoadNewMessages(ServerData) {
	let Result = null;
    return new Promise((resolve, reject) => {	
		return db.Messages.findAll({
			where: {
				Sended: 0
			},
			order: [
				['Id', 'ASC']
			],
			attributes: ['Id', 'Subject', 'Message']
		}).then(messages => {
			ServerData.Data.MessagesForSend = messages;
			ServerData.Data.DbStatusOk = true;
			resolve(ServerData);
		}).catch(err => {
			console.log(err);
			ServerData.Data.DbStatusOk = false;
			resolve(ServerData);
		});
	});
}

function LoadSenderPhones(ServerData){
    return new Promise((resolve, reject) => {	
		return db.SenderPhones.findAll({
			where: {
				Active: 1
			},
			order: [
				['Id', 'ASC']
			],
			attributes: ['Id', 'PhoneNumber', 'UserName', 'Password', 'Token']
		}).then(senderList => {
			ServerData.Data.SenderPhones = senderList;
			resolve(true);
		}).catch(err => {
			console.log(err);
			resolve(false);
		});
	});
}

function LoadRecipientPhones(ServerData){
    return new Promise((resolve, reject) => {	
		return db.RecipientPhones.findAll({
			where: {
				Unavailable: { [Op.ne]: 1 },
				Unsubscribed: { [Op.ne]: 1 },
			},
			order: [
				['Id', 'ASC']
			],
			attributes: ['Id', 'PhoneNumber']
		}).then(recipientList => {
			ServerData.Data.RecipientPhones = recipientList;
			resolve(true);
		}).catch(err => {
			console.log(err);
			resolve(false);
		});
	});
}

function SaveSendingStatus(messageId,senderId,recipientId){
    return new Promise((resolve, reject) => {
		return db.SendingStatuses.create({
			MessageId: '',
			SenderId: senderId,
			RecipientId: recipientId,
			Sended : 1,
			ErrorMessage : "neco"
		}).then(created => {
			resolve(true);
		}).catch(err => {
			resolve(false);
		});		
	});
}

//Code Help Syntax
/*
return db.ErrorTbl.create({
	LOCAL_PORT: localPort,
	TEXT: "input command: " + data.toString().toUpperCase() + ", Error: " + err.message.toString()
}).then(errCreated => {
	return null;
}).catch(err => {
	return null;
});
*/
