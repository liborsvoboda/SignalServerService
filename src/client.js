/*
  * Tento p��klad skriptu v�m umo��uje zaregistrovat telefonn� ��slo pomoc� Signal via
  * SMS a pot� odeslat a p�ijmout zpr�vu. Vyu��v� node-localstorage
  * modul pro ulo�en� informac� o stavu do cesty k adres��i dodan� serverem
  * prom�nn� prost�ed� 'STORE'.
  *
  * Nap��klad se dv�ma ��sly (ve v�choz�m nastaven� se pou��v� p��prava sign�lu
  * server, tak�e je bezpe�n� jej pou��vat, ani� by ucpal va�e kl��e). Heslo
  * je libovoln� �et�zec, pouze mus� z�stat konzistentn� mezi po�adavky:
  *
  * # Vy��dejte si ov��ovac� k�d prost�ednictv�m SMS pro prvn� ��slo:
  * STORE=./prvn� uzel ./example/client.js po�adavekSMS +15555555555 <heslo>
  *
  * # Nebo hlasem:
  * STORE=./first node ./example/client.js requestVoice +15555555555 <heslo>
  *
  * # Pot� obdr��te SMS na ��slo +15555555555 s k�dem. Ov��te to:
  * STORE=./prvn� uzel ./example/client.js registr +15555555555 <heslo> <K�D>
  *
  * # Opakujte proces s druh�m ��slem:
  * STORE=./druh� uzel ./example/client.js po�adavek +15555556666 <heslo>
  * STORE=./druh� uzel ./example/client.js registr +15555556666 <heslo> <K�D>
  *
  * # Nyn� v jednom termin�lu poslouchejte zpr�vy s jedn�m ��slem:
  * STORE=./prvn� uzel ./example/client.js p�ij�mat
  *
  * # A v jin�m termin�lu po�lete tomuto ��slu zpr�vu:
  * STORE=./druh� uzel ./example/client.js odeslat +15555555555 "PING"
  *
  * # V prvn�m termin�lu byste m�li vid�t v�stup zpr�vy, v�etn� "PING"
  *
  * # Chcete-li odeslat soubor, zadejte za text zpr�vy cestu:
  * STORE=./druh� uzel ./example/client.js odeslat +15555555555 "PING" /tmp/foo.jpg
  *
  * # Chcete-li aktualizovat �asova� vypr�en� platnosti konverzace:
  * STORE=./sekundov� uzel ./example/client.js vypr�� +15555555555 <sekundy>
  *
  */

const Signal = require('./index.js');
const Storage = require('./LocalSignalProtocolStore.js');

const protocolStore = new Signal.ProtocolStore(new Storage('../Store'));
protocolStore.load();
const ByteBuffer = require('bytebuffer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function printError(error) {
  console.log(error);
}

let accountManager;
  let messageSender;
  let username;
  let password;
  let number;
  let numbers;
  let groupId;
  let text;
  let expire;

switch (args[0]) {
  case 'request':
  case 'requestSMS':
    username = args[1];
    password = args[2];
    accountManager = new Signal.AccountManager(
      username,
      password,
      protocolStore
    );

    accountManager
      .requestSMSVerification()
      .then(result => {
        console.log('Sent verification code.');
        
      })
      .catch(printError);
    break;
  case 'requestVoice':
    username = args[1];
    password = args[2];
    accountManager = new Signal.AccountManager(
      username,
      password,
      protocolStore
    );

    accountManager
      .requestVoiceVerification()
      .then(result => {
        console.log('Calling for verification.');
        
      })
      .catch(printError);
    break;
  case 'register':
    username = args[1];
    password = args[2];
    const code = args[3];
    accountManager = new Signal.AccountManager(
      username,
      password,
      protocolStore
    );

    accountManager
      .registerSingleDevice(code)
      .then(result => {
        console.log(result);
      })
      .catch(printError);
    break;
  case 'send':
    number = args[1];
    text = args[2];
    attachments = [];
    messageSender = new Signal.MessageSender(protocolStore);
    messageSender.connect().then(() => {
      if (args[3]) {
        Signal.AttachmentHelper.loadFile(args[3])
          .then(file => {
            attachments.push(file);
          })
          .then(() => {
            messageSender
              .sendMessageToNumber({
                number,
                body: text,
                attachments,
              })
              .then(result => {
                console.log(result);
              })
              .catch(printError);
          });
      } else {
        messageSender
          .sendMessageToNumber({
            number,
            body: text,
            attachments,
          })
          .then(result => {
            console.log(result);
          })
          .catch(printError);
      }
    });
    break;
  case 'sendToGroup':
    groupId = args[1];
    numbers = args[2].split(',');
    text = args[3];
    attachments = [];
    messageSender = new Signal.MessageSender(protocolStore);
    messageSender.connect().then(() => {
      if (args[4]) {
        Signal.AttachmentHelper.loadFile(args[4])
          .then(file => {
            attachments.push(file);
          })
          .then(() => {
            messageSender
              .sendMessageToGroup({
                groupId,
                recipients: numbers,
                body: text,
                attachments,
              })
              .then(result => {
                console.log(result);
              })
              .catch(printError);
          });
      } else {
        messageSender
          .sendMessageToGroup({
            groupId,
            recipients: numbers,
            body: text,
          })
          .then(result => {
            console.log(result);
          })
          .catch(printError);
      }
    });
    break;
  case 'expire':
    number = args[1];
    expire = args[2];
    messageSender = new Signal.MessageSender(protocolStore);
    messageSender.connect().then(() => {
      messageSender
        .sendExpirationTimerUpdateToNumber(number, parseInt(expire))
        .then(result => {
          console.log(result);
        })
        .catch(printError);
    });
    break;
  case 'createGroup':
    name = args[1];
    numbers = args[2];
    messageSender = new Signal.MessageSender(protocolStore);
    messageSender.connect().then(() => {
      groupId = Signal.KeyHelper.generateGroupId();
      messageSender
        .createGroup(numbers.split(','), groupId, name)
        .then(result => {
          console.log('Created group with ID: ', groupId);
        })
        .catch(printError);
    });
    break;
  case 'leaveGroup':
    groupId = args[1];
    numbers = args[2].split(',');
    messageSender = new Signal.MessageSender(protocolStore);
    messageSender.connect().then(() => {
      messageSender
        .leaveGroup(groupId, numbers)
        .then(result => {
          console.log(result);
          console.log('Left group with ID: ', groupId);
        })
        .catch(printError);
    });
    break;
  case 'receive':
    const messageReceiver = new Signal.MessageReceiver(protocolStore);
    messageReceiver.connect().then(() => {
      messageReceiver.addEventListener('message', ev => {
        console.log('*** EVENT ***:', ev);
        ev.data.message.attachments.map(attachment => {
          messageReceiver
            .handleAttachment(attachment)
            .then(attachmentPointer => {
              Signal.AttachmentHelper.saveFile(attachmentPointer, './').then(
                fileName => {
                  console.log('Wrote file to: ', fileName);
                }
              );
            });
        });
        if (ev.data.message.group) {
          console.log(ev.data.message.group);
          console.log(
            `Received message in group ${ 
              ev.data.message.group.id
               }: ${
               ev.data.message.body}`
          );
        } else {
          console.log('Received message: ', ev.data.message.body);
        }
        ev.confirm();
      });
      messageReceiver.addEventListener('configuration', ev => {
        console.log('Received configuration sync: ', ev.configuration);
        ev.confirm();
      });
      messageReceiver.addEventListener('group', ev => {
        console.log('Received group details: ', ev.groupDetails);
        ev.confirm();
      });
      messageReceiver.addEventListener('contact', ev => {
        console.log(
          `Received contact for ${ 
            ev.contactDetails.number
             } who has name ${
             ev.contactDetails.name}`
        );
        ev.confirm();
      });
      messageReceiver.addEventListener('verified', ev => {
        console.log('Received verification: ', ev.verified);
        ev.confirm();
      });
      messageReceiver.addEventListener('sent', ev => {
        console.log(
          `Message successfully sent from device ${ 
            ev.data.deviceId
             } to ${
             ev.data.destination
             } at timestamp ${
             ev.data.timestamp}`
        );
        ev.confirm();
      });
      messageReceiver.addEventListener('delivery', ev => {
        console.log(
          `Message successfully delivered to number ${ 
            ev.deliveryReceipt.source
             } and device ${
             ev.deliveryReceipt.sourceDevice
             } at timestamp ${
             ev.deliveryReceipt.timestamp}`
        );
        ev.confirm();
      });
      messageReceiver.addEventListener('read', ev => {
        console.log(
          `Message read on ${ 
            ev.read.reader
             } at timestamp ${
             ev.read.timestamp}`
        );
        ev.confirm();
      });
    });
    break;
  default:
    console.log('No valid command specified.');
    break;
}
