/*
  * Tento pøíklad skriptu vám umožòuje zaregistrovat telefonní èíslo pomocí Signal via
  * SMS a poté odeslat a pøijmout zprávu. Využívá node-localstorage
  * modul pro uložení informací o stavu do cesty k adresáøi dodané serverem
  * promìnná prostøedí 'STORE'.
  *
  * Napøíklad se dvìma èísly (ve výchozím nastavení se používá pøíprava signálu
  * server, takže je bezpeèné jej používat, aniž by ucpal vaše klíèe). Heslo
  * je libovolný øetìzec, pouze musí zùstat konzistentní mezi požadavky:
  *
  * # Vyžádejte si ovìøovací kód prostøednictvím SMS pro první èíslo:
  * STORE=./první uzel ./example/client.js požadavekSMS +15555555555 <heslo>
  *
  * # Nebo hlasem:
  * STORE=./first node ./example/client.js requestVoice +15555555555 <heslo>
  *
  * # Poté obdržíte SMS na èíslo +15555555555 s kódem. Ovìøte to:
  * STORE=./první uzel ./example/client.js registr +15555555555 <heslo> <KÓD>
  *
  * # Opakujte proces s druhým èíslem:
  * STORE=./druhý uzel ./example/client.js požadavek +15555556666 <heslo>
  * STORE=./druhý uzel ./example/client.js registr +15555556666 <heslo> <KÓD>
  *
  * # Nyní v jednom terminálu poslouchejte zprávy s jedním èíslem:
  * STORE=./první uzel ./example/client.js pøijímat
  *
  * # A v jiném terminálu pošlete tomuto èíslu zprávu:
  * STORE=./druhý uzel ./example/client.js odeslat +15555555555 "PING"
  *
  * # V prvním terminálu byste mìli vidìt výstup zprávy, vèetnì "PING"
  *
  * # Chcete-li odeslat soubor, zadejte za text zprávy cestu:
  * STORE=./druhý uzel ./example/client.js odeslat +15555555555 "PING" /tmp/foo.jpg
  *
  * # Chcete-li aktualizovat èasovaè vypršení platnosti konverzace:
  * STORE=./sekundový uzel ./example/client.js vyprší +15555555555 <sekundy>
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
