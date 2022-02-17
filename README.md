# pivpn-js

## Overview

This is a library, which wraps pivpn with JavaScript and makes it possible to interact with the cli-commands much faster and more efficient.

## Prerequisites

- `pivpn`
- `qrencode`
- `node.js >= 12.19.0`

## Install

#### NPM

```bash
npm install pivpn-js
```

#### From source

```bash
git clone https://github.com/caio-silva/pivpn-js.git
cd pivpn-js
npm install
```

## Getting started

```javascript
const PiVPNJs = require("pivpn-js")
const confPath = "/path/to/dir/containing/conf/files"

const pivpnJs = new PiVPNJs(confPath)
// or 
// const pivpnJs = new PiVPNJs()
// pivpnJs.setConfPath(confPath)

(async function(){

  console.log(pivpnJs.getConfPath())

  const userName = "john-do-phone"
  wasUserAdded = await pivpnJs.addUser(userName)
  console.log(`Was user added: ${wasUserAdded}`)

  const userFileLocation = await pivpnJs.getUserFileLocation(userName)
  console.log(`Path to conf file: ${userFileLocation}`)

  const userQrCodePath = await pivpnJs.generateUserQrCode(userName)
  console.log(`Path to qr code: ${userQrCodePath}`)
  // or (this method first checks if qr exists if not it creates it)
  // const userQrCodePath = await pivpnJs.getUserQrCodePath(userName)
  // console.log(`Path to qr code: ${userQrCodePath}`)

  const connectionDetailsForUser = await pivpnJs.getConnectionDetailsForUser(userName)
  console.table(connectionDetailsForUser)

  const connectionDetailsForAllUsers = await pivpnJs.getConnectionDetailsForAllUsers()
  console.table(connectionDetailsForAllUsers)

  const userInfo = await pivpnJs.getUserInfo(userName)
  console.table(userInfo)

  const allUsersInfo = await pivpnJs.getAllUsersInfo()
  console.table(allUsersInfo)

  const userQrCodeStream = await getUserQrCodeStream(userName)

  const wasUserRemoved = await pivpnJs.removeUser(userName)
  console.log(`Was user removed: ${wasUserRemoved}`)

  const wasPiVPNUpdated = await pivpnJs.updatePiVPN()
  console.log(`Was pivpn updated: ${wasPiVPNUpdated}`)

  const backupInfo = await pivpnJs.backup()
  console.log(backupInfo)

})()


```
