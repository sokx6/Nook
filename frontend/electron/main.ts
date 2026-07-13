import { spawn, type ChildProcess } from 'child_process'
import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { join } from 'path'
import http from 'http'

let mainWindow: BrowserWindow | null = null
let backend: ChildProcess | null = null
const isDev = !app.isPackaged

function resolveBackendExe(): string {
  if (isDev) {
    return join(
      __dirname,
      '..', '..', '..', 'backend', '.venv', 'Scripts', 'python.exe'
    )
  }
  return join(process.resourcesPath, 'backend', 'nook-backend.exe')
}

function resolveBackendArgs(): string[] {
  if (isDev) {
    return [join(__dirname, '..', '..', '..', 'backend', 'app', 'main.py')]
  }
  return []
}

function waitForBackend(url: string, retries = 30, interval = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempt = 0
    const check = () => {
      attempt++
      http.get(url, (res) => {
        res.resume()
        if (res.statusCode === 200) {
          resolve()
        } else if (attempt < retries) {
          setTimeout(check, interval)
        } else {
          reject(new Error(`Backend returned ${res.statusCode} after ${retries} attempts`))
        }
      }).on('error', () => {
        if (attempt < retries) {
          setTimeout(check, interval)
        } else {
          reject(new Error(`Backend not reachable after ${retries} attempts`))
        }
      })
    }
    check()
  })
}

function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const exePath = resolveBackendExe()
    const args = resolveBackendArgs()
    const healthUrl = 'http://localhost:11451/health'

    // Start ollama serve in background (ignore if already running)
    if (!isDev) {
      spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        shell: true
      }).unref()
    }

    backend = spawn(exePath, args, {
      stdio: 'pipe',
      env: { ...process.env }
    })

    backend.stdout?.on('data', (data: Buffer) => {
      console.log(`[backend] ${data.toString().trim()}`)
    })
    backend.stderr?.on('data', (data: Buffer) => {
      console.log(`[backend] ${data.toString().trim()}`)
    })

    backend.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn backend: ${err.message}`))
    })

    backend.on('exit', (code: number | null) => {
      if (!mainWindow) {
        reject(new Error(`Backend exited with code ${code} before window was created`))
      }
    })

    waitForBackend(healthUrl)
      .then(resolve)
      .catch(reject)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Nook - AI Chat',
    icon: join(__dirname, '../src/renderer/assets/logo.svg'),
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function killBackend(): void {
  if (backend && !backend.killed) {
    backend.kill()
    backend = null
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)

  ipcMain.handle('app:restart', () => {
    app.relaunch()
    app.exit()
  })

  if (isDev) {
    createWindow()
  } else {
    try {
      await startBackend()
      createWindow()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      dialog.showErrorBox('Nook - Startup Error',
        `Failed to start backend:\n${msg}\n\nPlease ensure Nook is installed correctly.`)
      app.quit()
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  killBackend()
})
