/* eslint-disable no-unused-vars */
'use strict'

import { app, protocol, BrowserWindow, dialog} from 'electron'
// import CANUDS from './uds/canuds.js'

import {
  createProtocol,
  installVueDevtools 
} from 'vue-cli-plugin-electron-builder/lib'
import { compile } from 'vue-template-compiler'

const k1SHEGen = require('./crypto/k1she.js')
const k3SHEGen = require('./crypto/k3she.js')
const CANUDS = require('./uds/canuds.js')
const IPUDS = require('./uds/ipuds.js')
const { ipcMain } = require('electron')
const fs = require('fs')
const isDevelopment = process.env.NODE_ENV !== 'production'
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let canuds
let ipuds
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 1200, height: 620, minWidth:1000, webPreferences: {
    nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
  },
  // eslint-disable-next-line no-undef
  icon: `${__static}/logo.ico` })
 
  canuds = new CANUDS(win)
  canuds.registerCallback(() => {
    canuds.eventHandle()
  })
  
  ipuds = new IPUDS(win)
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
    if(canuds!==null){
      canuds.Unload()
      canuds = null
    }

  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('readFile', (event, arg) => {
  var file = dialog.showOpenDialogSync(win,{
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ],
  })
  if(Array.isArray(file)){
    event.returnValue=fs.readFileSync(file[0])
  }else{
    event.returnValue=''
  }
})
ipcMain.on('saveFile', (event, arg) => {
  var file = dialog.showSaveDialogSync(win,{
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ],
  })
  if(typeof file ==="string"){
    fs.writeFileSync(file,arg)
  }
  event.returnValue = file
})

ipcMain.on('saveFilePath', (event, arg) => {
  var path=''
  var file = dialog.showSaveDialogSync(win)
  if(typeof file ==="string"){
    path=file
  }
  event.returnValue = path
})


ipcMain.on('downloadFilePath', (event, arg) => {
  var file = dialog.showOpenDialogSync(win)
  var size = 0
  var path = ''
  if(Array.isArray(file)){
    path=file[0]
    size=fs.statSync(file[0]).size
  }
  event.returnValue={
    path:path,
    size:size
  }
})
ipcMain.on('k3SHEGen', (event, arg) => {
  var flag2=function(flag){
    var fo={}
    for(var i in flag){
      fo[flag[i]]=true
    }
    return fo
  }
  var ret=k3SHEGen(
    arg.authKeyId,//auth key id
    Buffer.from(arg.authKeyValue,'hex'), //auth key value
    arg.keyId,//update key id
    Buffer.from(arg.keyValue,'hex'), //update key value
    flag2(arg.flag),//flag
    parseInt(arg.counter),//cid
    Buffer.from(arg.uid,'hex') //uid
  )
  
  event.returnValue = ret
})
ipcMain.on('k1SHEGen', (event, arg) => {
  var flag2=function(flag){
    var fo={}
    for(var i in flag){
      fo[flag[i]]=true
    }
    return fo
  }
  var ret=k1SHEGen(
    parseInt(arg.authKeyId),//auth key id
    Buffer.from(arg.authKeyValue,'hex'), //auth key value
    parseInt(arg.keyId),//update key id
    Buffer.from(arg.keyValue,'hex'), //update key value
    flag2(arg.flag),//flag
    parseInt(arg.counter),//cid
    Buffer.from(arg.uid,'hex') //uid
  )
  
  event.returnValue = ret
})