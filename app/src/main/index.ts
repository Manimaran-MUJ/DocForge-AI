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

    let data: Buffer
    let extension: string

    // Support remote HTTP/HTTPS images.
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
      const response = await fetch(imageUrl)

      if (!response.ok) {
        console.error('Unable to download remote image:', imageUrl, response.status)
        return null
      }

      const arrayBuffer = await response.arrayBuffer()
      data = Buffer.from(arrayBuffer)

      const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()

      const extensionByContentType: Record<string, string> = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/gif': '.gif',
        'image/bmp': '.bmp',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
      }

      extension =
        extensionByContentType[contentType ?? ''] ??
        path.extname(new URL(imageUrl).pathname).toLowerCase()
    } else if (imageUrl.startsWith('data:')) {
      // Support embedded base64 images.
      const match = imageUrl.match(/^data:(image\/[^;,]+);base64,(.+)$/s)

      if (!match) {
        console.warn('Unsupported data image format')
        return null
      }

      data = Buffer.from(match[2], 'base64')

      const extensionByContentType: Record<string, string> = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/gif': '.gif',
        'image/bmp': '.bmp',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
      }

      extension = extensionByContentType[match[1].toLowerCase()] ?? ''
    } else {
      // Resolve local image paths relative to the Markdown file.
      let decodedImageUrl = imageUrl

      try {
        decodedImageUrl = decodeURIComponent(imageUrl)
      } catch {
        // Keep the original path if decoding fails.
      }

      const markdownDirectory = path.dirname(markdownFilePath)

      const imagePath = path.isAbsolute(decodedImageUrl)
        ? decodedImageUrl
        : path.resolve(markdownDirectory, decodedImageUrl)

      console.log('Reading local Markdown image:', imagePath)

      data = await fs.readFile(imagePath)
      extension = path.extname(imagePath).toLowerCase()
    }

    // Decode the image and obtain its dimensions.
    const image = nativeImage.createFromBuffer(data)

    if (image.isEmpty()) {
      console.error('Unable to decode image:', imageUrl)
      return null
    }

    const size = image.getSize()

    const contentTypeByExtension: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    }

    const contentType = contentTypeByExtension[extension] ?? 'application/octet-stream'

    console.log('Markdown image loaded:', imageUrl, size)

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
