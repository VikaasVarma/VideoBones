import { app, BrowserWindow } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.ts')
    }
  })

  mainWindow.loadFile(path.join('build', 'renderer', 'index.html'))
  // mainWindow.webContents.openDevTools()
}
app.whenReady().then(async () => {
  try {
    await installExtension(VUEJS_DEVTOOLS)
  } catch (e:any) {
    console.error('Vue Devtools failed to install:', e.toString())
  }
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
