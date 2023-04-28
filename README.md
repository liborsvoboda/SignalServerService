
Customizing

https://github.com/throneless-tech/libsignal-service-javascript
npm install --save @throneless/libsignal-service

cd E:\Projekty\SoftSun\SignalServerService

OperationNumber Legend:

0  -  Check new Messages - check if in db is new message for sending





---------------------------------------------------------------------------------------------------------------

# libsignal-service-javascript
**This is a third-party effort, and is NOT a part of the official [Signal](https://signal.org) project or any other project of [Open Whisper Systems](https://whispersystems.org).**

A javascript library for basic interaction with the [Signal](https://signal.org) messaging service. This library is a standalone port to [Node.js](https://nodejs.org) of the backend components of [Signal-Desktop](https://github.com/WhisperSystems/Signal-Desktop). Not to be confused with [libsignal-protocol-javascript](https://github.com/signalapp/libsignal-protocol-javascript), which only includes the Signal wire protocol, this library contains the logic for actually interacting with the Signal messaging servers as currently operated by OWS. As such, it is intended to be a Javascript equivalent of [libsignal-service-java](https://github.com/signalapp/libsignal-service-java) and provide a similar API.

## Usage

To use this in your Node.js project, run the following from your project directory:

`npm install --save @throneless/libsignal-service`

The overall design of the library attempts to keep the overall feel of the upstream code in order to make it (somewhat) easier to keep up with upstream changes, while trying to be relatively ergonomic for developers using this is in their own projects. The library is split into three components that encompass particular functionality:

* `AccountManager` for registering and confirming accounts.
* `MessageSender` for sending messages.
* `MessageReceiver` for receiving messages.

Those three components in turn share a fourth component, `ProtocolStore`, to track overall state. This includes key and session data as well as unprocessed messages. There are two additional top-level components that provide various helper functions:

* `KeyHelper` for various cryptographic helper functions.
* `AttachmentHelper` for file management helper functions.

Much of the Signal service relies on phone numbers, and when using this library you must use phone numbers in [E.123](https://en.wikipedia.org/wiki/E.123) format (without spaces). So for instance a U.S. phone number (555) 555-5555 would be written +15555555.

### Initializing the store

Usage of the library requires a `ProtocolStore` to save keys and other state. This storage is pluggable for different storage backends via a relatively straightforward API. An example that uses [node-localstorage](https://github.com/lmaccherone/node-localstorage) can be found in the `examples` directory, and an example that just stores the keys in-memory can be found in the `tests` directory. See below for an overview of creating your own storage backend.

```
const Signal = require('libsignal-service');
const myBackend = new MyStorageBackend(); // This is your storage backend implementation.
const protocolStore = new Signal.ProtocolStore(myBackend);
protocolStore.load(); // Load the data from the backend into the in-memory cache.
```

### Registering accounts

Registering an account takes place in two phases. First, you'll request a confirmation code from the Signal server that you are authorized to use this number (when experimenting you probably want to get a temporary phone number via an online service like Google Voice or Twilio rather than clobbering the keys for your own phone! For safety, the library uses the Signal staging server by default. **This means that it will only send and receive messages from other clients using the staging server!** *If utilized with `NODE_ENV=production`, it will use the live Signal server*). The password below is an arbitrary string used for authentication against the Signal API, it will be registered with the Signal servers as part of the registration process.

```
const password = Signal.KeyHelper.generatePassword(); // A simple helper function to generate a random password.
const accountManager = new Signal.AccountManager(myPhoneNumber, password, protocolStore); // The protocolStore from above
accountManager.requestSMSVerification().then(result => {
  console.log("Sent verification code.");
});
```

You'll receive an SMS message with an authentication code at the number your specified (or a voice call, if you use `requestVoiceVerification()` instead). Use the code (without any hyphens or spaces) to register your account with the Signal service:

```
accountManager.registerSingleDevice("myCode").then(result => {
  console.log("Registered account.");
});
```

### Sending messages

To send a message, connect a `MessageSender` instance to the Signal service:

```
const messageSender = new Signal.MessageSender(protocolStore);
messageSender.connect().then(() => {
  messageSender.sendMessageToNumber({
    number: destinationNumber,
    body: "Hello world!"
  })
  .then(result => {
    console.log(result);
  });
});
```

If the `sendMessageToNumber()` function also takes an array of attachments, if you wish to send one or more files. To help process files into a format Signal understands, we can use the `AttachmentHelper`:

```
const attachments = [];
messageSender.connect().then(() => {
  Signal.AttachmentHelper.loadFile(path)  // a path to the file to send, can also take a caption string
  .then(file => {
    attachments.push(file);
  })
  .then(() => {
    messageSender.sendMessageToNumber({
      number: destinationNumber,
      body: "Hello world!",
      attachments: attachments
    })
    .then(result => {
      console.log(result);
    });
  });
});
```

For more complex examples, including experimental support for managing and sending to groups, see `client.js` in the examples directory.

### Receiving messages

To receive messages, you connect a `MessageReceiver` instance to the Signal service and then subscribe to its EventEmitter to listen for particular events. The message is returned as an attribute of the event object:

```
const messageReceiver = new Signal.MessageReceiver(protocolStore);
messageReceiver.connect().then(() => {
  // Subscribe to the "message" event
  messageReceiver.addEventListener("message", ev => {
    ev.data.message.attachments.map(attachment => {
      messageReceiver
        .handleAttachment(attachment)
        .then(attachmentPointer => {
	  // if there are attachments, save them to the current directory.
          Signal.AttachmentHelper.saveFile(attachmentPointer, "./").then(
            fileName => {
              console.log("Wrote file to: ", fileName);
            }
          );
        });
    });
    if (ev.data.message.group) {
      console.log(ev.data.message.group);
      console.log(
        "Received message in group " +
          ev.data.message.group.id +
          ": " +
          ev.data.message.body
      );
    } else {
      console.log("Received message: ", ev.data.message.body);
    }
    ev.confirm();
  });
});
```

For more events you can listen for, see `client.js` in the examples directory.

### Implementing your own storage backend

So how do you store keys and other information in your application's database? Well, you can implement your own storage backend. Just create an object that implements the following methods. The storage backend stores arbitrary JSON objects that each have an 'id' property that holds a string. They're split into different types of data (identity keys, sessions, pre-keys, signed pre-keys, unprocessed messages, and configuration) so that these can easily be split into, for example, different database tables.

```
class myStorageBackend {
  async getAllIdentityKeys() {}
  async createOrUpdateIdentityKey(data) {}
  async removeIdentityKeyById(id) {}

  async getAllSessions() {}
  async createOrUpdateSession(data) {}
  async removeSessionById(id) {}
  async removeSessionsByNumber(number) {}
  async removeAllSessions() {}

  async getAllPreKeys() {}
  async createOrUpdatePreKey(data) {}
  async removePreKeyById(id) {}
  async removeAllPreKeys() {}

  async getAllSignedPreKeys() {}
  async createOrUpdateSignedPreKey(data) {}
  async removeSignedPreKeyById(id) {}
  async removeAllSignedPreKeys() {}

  async getAllUnprocessed() {}
  async getUnprocessedCount() {} // returns the number of unprocessed messages
  async getUnprocessedById(id) {}
  async saveUnprocessed(data) {}
  async updateUnprocessedAttempts(id, attempts) {} // updates the 'attempts' property of the unprocessed message
  async updateUnprocessedWithData(id, data) {}
  async removeUnprocessed(id) {}
  async removeAllUnprocessed() {}

  async getAllConfiguration() {}
  async createOrUpdateConfiguration(data) {}
  async removeConfigurationById(id) {}
  async removeAllConfiguration() {}

  async removeAll() {} // clears all storage
}
```

For more details, an example that uses [node-localstorage](https://github.com/lmaccherone/node-localstorage) can be found in the `examples` directory, and an example that just stores the keys in-memory can be found in the `tests` directory. 

## Todo

* [X] Additional documentation.
* [X] Simplify `ProtocolStore` API.
* [X] Cleanup frontend API.
* [X] Update wire-protocol dependency.
* [ ] Additional unit test coverage.
* [ ] Webpack integration for browser support.

## License
[<img src="https://www.gnu.org/graphics/gplv3-127x51.png" alt="GPLv3" >](http://www.gnu.org/licenses/gpl-3.0.html)

Libsignal-service-javascript is a free software project licensed under the GNU General Public License v3.0 (GPLv3) by [Throneless Tech](https://throneless.tech).

It is derived in part from [Signal-Desktop](https://github.com/WhisperSystems/Signal-Desktop) which is Copyright (c) 2014-2018 Open Whisper Systems, also under the GPLv3.


CZ:

Nově v nabídce "Naprosto unikátní EASY SYSTEM BUILDER" 
absolutně snadná tvorba 3vrstvého systému (LIBOVOLNÁ DB, BACKEND-SERVER, FRONTEND-KLIENT) se znalostmi excelu
Stačí vytvořit Tabulku pro Data a Formulář, vše v grafických designerech
Systém si tedy doslova naklikáte, Každý den 1 tabulka = za měsíc prodejní systém i s objednávkami a nabídkami
A TO ANI NÁHODOU NENÍ VŠE.
Nemusí to být pouze systém Datový, ale bez probléMu i multimediální, na stříhání videí, práce s fotkami či 3D
nebo Dokonce SYSTÉM ŘÍDÍCÍ pro ovládání strojů (Aktuálně je podpora PLC SIEMENS), nebo libovolného jiného Hardware
po dodání specifik. 
Či dále systém Kontrolní, Zálohovací, DataWarehouse, Controling, BI OLAP, Flow Procesy, 
Výrobní, Informační či business dotykové Terminály.  TAKÉ JE MOŽNÉ VYUŽÍT JEN JAKO NADSTAVBU, ČI SPOJENÍ SYSTÉMŮ

Zahajovací náklad za jádro je pouhých 10 000Kč / 400Euro , a můžete si zkoušet sami či levně doobjednat
co tam budete chtít přidat. Neohýbejte se před systémem vy, POŘIĎTE SI SYSTÉM PŘESNĚ NA MÍRU.
Pro představu:
 - fakturační systém s OBJ+NAB+MULTIPOBOČKY,SKLAD,POKLADNA                        - 14 DNÍ
 - implementace dotykového terminálu do výroby pro výkazy práce                   - 4 DNY
 - Právěš vzniká systém pro hotely včetně pokojové agengy,fakturace a objednávek  - 1 MĚSÍC
 - Updaty Zdarma, 1 vývoj pro všechny klienty přes sdílené agendy projektu v kódu
 
 Neomezený počet uživatelů, neomezený tisk, neomezené možnosti, návody, tipy, triky, rady,
 Připraveno pro všechny typy systémů a terminálů pro MS WINDOWS
 
INTELIGENTNÍ DOKUMENTACE: https://liborsvoboda.github.io/EASYSYSTEM-EASYSERVER-CZ/  
KÓD: https://github.com/liborsvoboda/EASYSYSTEM-EASYSERVER-CZ  
ONLINE UKÁZKA: https://kliknetezde.cz  

 TAK NEOTÁLEJTE A OZVĚTE SE JEŠTĚ DNES NEŽ PŮJDE CENA NAHORU
 BACKEND SERVER JE OŽNÉ POUŽÍT SAMOSTATNĚ PRO LIBOVOLNÝ JINÝ MULTIPLATFORMNÍ PROJEKT
 
 IT Architekt
 Libor Svoboda GroupWare-Solution.Eu
 Tel: 00420 724986873, email: Libor.Svoboda@GroupWare-Solution.Eu
 
 
 
----------------------------------------------------------------------------------------
EN: 
 
New in the menu "Absolutely unique EASY SYSTEM BUILDER"
absolutely easy to create a 3-tier system (LIBOVOLNÁ DB, BACKEND-SERVER, FRONTEND-KLIENT) with excel knowledge
Just create a Table for Data and a Form, all in graphic designers
So you literally click on the system, 1 table every day = sales system with orders and offers per month
And that's not all, by any chance.
It doesn't have to be only a data system, but also a multimedia one without any problem, for cutting videos, working with photos or 3D
or even a CONTROL SYSTEM for machine control (Currently SIEMENS PLC is supported), or any other Hardware
after delivery of specifications.
Or the Control system, Backup, DataWarehouse, Controlling, BI OLAP, Flow Processes,
Production, Information or business touch Terminals. IT CAN ALSO BE USED ONLY AS AN EXTENSION OR CONNECTION OF SYSTEMS

The starting cost for the core is only 10,000 CZK / 400 Euro, and you can try it yourself or order cheaply
what you want to add there. Don't bow down to the system, GET A CUSTOMIZED SYSTEM.
For idea:
  - invoicing system with OBJ+NAB+MULTI BRANCHES, WAREHOUSE, CHECKOUT - 14 DAYS
  - implementation of a touch terminal in production for work reports - 4 DAYS
  - A system for hotels including room agency, invoicing and orders is currently being created - 1 MONTH
  - Free updates, 1 development for all clients via shared project agendas in code
 
  Unlimited users, unlimited printing, unlimited options, tutorials, tips, tricks, advice,
  Prepared for all types of systems and terminals for MS WINDOWS
 
INTELLIGENT DOCUMENTATION: https://liborsvoboda.github.io/EASYSYSTEM-EASYSERVER-EN/  
CODE: https://github.com/liborsvoboda/EASYSYSTEM-EASYSERVER-EN  
ONLINE EXAMPLE: https://kliknetezde.cz  

  SO DON'T DELAY AND CALL TODAY BEFORE THE PRICE GOES UP
  BACKEND SERVER CAN BE USED INDEPENDENTLY FOR ANY OTHER MULTIPLATFORM PROJECT

  IT Architect
  Libor Svoboda GroupWare-Solution.Eu
  Tel: 00420 724986873, email: Libor.Svoboda@GroupWare-Solution.Eu
