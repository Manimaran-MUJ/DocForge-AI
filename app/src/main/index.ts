import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'node:fs/promises'
import path from 'node:path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('dialog:openMarkdownFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Markdown File',
    filters: [
      {
        name: 'Markdown Files',
        extensions: ['md', 'markdown']
      }
    ],
    properties: ['openFile']
  })

  if (result.canceled) {
    return null
  }

  return result.filePaths[0]
})

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

ipcMain.handle('file:saveDocxToDownloads', async (_, fileName: string, data: Uint8Array) => {
  try {
    const downloadsPath = app.getPath('downloads')

    const extension = '.docx'

    const baseName = fileName.endsWith(extension) ? fileName.slice(0, -extension.length) : fileName

    let outputPath = path.join(downloadsPath, `${baseName}${extension}`)

    let counter = 1

    while (await fileExists(outputPath)) {
      outputPath = path.join(downloadsPath, `${baseName} (${counter})${extension}`)

      counter += 1
    }

    await fs.writeFile(outputPath, Buffer.from(data))

    console.log('DOCX saved to Downloads:', outputPath)

    return outputPath
  } catch (error) {
    console.error('Unable to save DOCX to Downloads:', error)

    return null
  }
})

ipcMain.handle('file:readMarkdown', async (_, filePath: string) => {
  try {
    console.log('Reading Markdown file:', filePath)

    const content = await fs.readFile(filePath, 'utf-8')

    console.log('Markdown file read successfully')
    console.log('Content length:', content.length)

    return content
  } catch (error) {
    console.error('Unable to read markdown file:', error)
    return null
  }
})

ipcMain.handle('file:readImage', async (_, imageUrl: string, markdownFilePath: string) => {
  try {
    if (!imageUrl) {
      return null
    }

    /*
     * Ignore remote images for now.
     * Local Markdown images are resolved relative
     * to the Markdown file.
     */
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:')
    ) {
      console.warn('Remote/data image is not supported:', imageUrl)

      return null
    }

    /*
     * Decode URL-encoded paths such as:
     *
     * images/My%20Image.png
     */
    let decodedImageUrl = imageUrl

    try {
      decodedImageUrl = decodeURIComponent(imageUrl)
    } catch {
      decodedImageUrl = imageUrl
    }

    /*
     * Resolve the image relative to the Markdown file.
     *
     * Example:
     *
     * Markdown:
     * C:\Docs\Test.md
     *
     * Image:
     * ./images/test.png
     *
     * Result:
     * C:\Docs\images\test.png
     */
    const markdownDirectory = path.dirname(markdownFilePath)

    const imagePath = path.isAbsolute(decodedImageUrl)
      ? decodedImageUrl
      : path.resolve(markdownDirectory, decodedImageUrl)

    console.log('Reading Markdown image:', imagePath)

    const data = await fs.readFile(imagePath)

    const image = nativeImage.createFromBuffer(data)

    if (image.isEmpty()) {
      console.error('Unable to decode image:', imagePath)

      return null
    }

    const size = image.getSize()

    const extension = path.extname(imagePath).toLowerCase()

    let contentType: string

    switch (extension) {
      case '.png':
        contentType = 'image/png'
        break

      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break

      case '.gif':
        contentType = 'image/gif'
        break

      case '.bmp':
        contentType = 'image/bmp'
        break

      case '.webp':
        contentType = 'image/webp'
        break

      default:
        contentType = 'application/octet-stream'
        break
    }

    console.log('Markdown image loaded:', imagePath, size)

    return {
      data: new Uint8Array(data),
      contentType,
      width: size.width,
      height: size.height
    }
  } catch (error) {
    console.error('Unable to read Markdown image:', imageUrl, error)

    return null
  }
})
