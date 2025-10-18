import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

const SYSFS_BASE = '/sys/devices/platform/aorus_laptop';

// Helper function to read sysfs file
async function readSysfs(file: string): Promise<string> {
  try {
    const content = await fs.readFile(path.join(SYSFS_BASE, file), 'utf-8');
    return content.trim();
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return '0';
  }
}

// Helper function to write sysfs file (requires sudo)
async function writeSysfs(file: string, value: string): Promise<boolean> {
  try {
    const filePath = path.join(SYSFS_BASE, file);
    const command = `echo '${value}' | pkexec tee ${filePath} > /dev/null`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    return false;
  }
}

// Find hwmon paths
async function findHwmonPath(type: 'temp' | 'fan'): Promise<string | null> {
  try {
    const pattern = path.join(SYSFS_BASE, 'hwmon', 'hwmon*', `${type}1_input`);
    const { stdout } = await execAsync(`ls ${pattern} 2>/dev/null | head -1`);
    const fullPath = stdout.trim();
    if (fullPath) {
      return fullPath.replace(new RegExp(`/${type}1_input$`), '');
    }
  } catch (error) {
    console.error(`Error finding hwmon path for ${type}:`, error);
  }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
    title: 'Aorus Control Panel',
    backgroundColor: '#0f0f14',
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'hiddenInset' as any,
    trafficLightPosition: { x: 16, y: 16 },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Remove or comment out this line:
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('read-temps', async () => {
  const hwmonPath = await findHwmonPath('temp');
  if (!hwmonPath) return [0, 0, 0];

  const temps: number[] = [];
  for (let i = 1; i <= 3; i++) {
    try {
      const content = await fs.readFile(path.join(hwmonPath, `temp${i}_input`), 'utf-8');
      temps.push(Math.floor(parseInt(content.trim()) / 1000));
    } catch {
      temps.push(0);
    }
  }
  return temps;
});

ipcMain.handle('read-fans', async () => {
  const hwmonPath = await findHwmonPath('fan');
  if (!hwmonPath) return [0, 0, 0, 0];

  const fans: number[] = [];
  for (let i = 1; i <= 4; i++) {
    try {
      const content = await fs.readFile(path.join(hwmonPath, `fan${i}_input`), 'utf-8');
      fans.push(parseInt(content.trim()));
    } catch {
      fans.push(0);
    }
  }
  return fans;
});

ipcMain.handle('read-system-state', async () => {
  const modeMap: { [key: string]: string } = {
    '0': 'Normal',
    '1': 'Silent',
    '2': 'Gaming',
    '3': 'Custom',
    '4': 'Auto',
    '5': 'Fixed',
  };

  const fanModeRaw = await readSysfs('fan_mode');
  const chargeModeRaw = await readSysfs('charge_mode');
  const chargeLimitRaw = await readSysfs('charge_limit');
  const gpuBoostRaw = await readSysfs('gpu_boost');

  return {
    fan_mode: modeMap[fanModeRaw] || 'Normal',
    charge_mode: chargeModeRaw === '1',
    charge_limit: parseInt(chargeLimitRaw) || 100,
    gpu_boost: gpuBoostRaw === '1',
  };
});

ipcMain.handle('apply-settings', async (_, settings) => {
  const profileMap: { [key: string]: string } = {
    'Normal': '0',
    'Silent': '1',
    'Gaming': '2',
    'Auto': '4',
    'Fixed': '5',
  };

  const mode = profileMap[settings.fan_profile] || '0';
  const speed = settings.custom_speed.toString();
  const chargeMode = settings.charge_mode ? '1' : '0';
  const chargeLimit = settings.charge_limit.toString();
  const gpuBoost = settings.gpu_boost ? '1' : '0';

  try {
    const results = await Promise.all([
      writeSysfs('fan_mode', mode),
      // Only write custom speed if in Auto or Fixed mode
      (settings.fan_profile === 'Auto' || settings.fan_profile === 'Fixed') ? writeSysfs('fan_custom_speed', speed) : Promise.resolve(true),
      writeSysfs('charge_mode', chargeMode),
      writeSysfs('charge_limit', chargeLimit),
      writeSysfs('gpu_boost', gpuBoost),
    ]);

    const success = results.every(r => r);
    return { success, error: success ? null : 'Failed to apply some settings' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    const configPath = path.join(app.getPath('home'), '.config', 'aorus-control', 'settings.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      fan_profile: 'Normal',
      custom_speed: 50,
      charge_mode: false,
      charge_limit: 100,
      gpu_boost: false,
    };
  }
});

ipcMain.handle('save-settings', async (_, settings) => {
  try {
    const configDir = path.join(app.getPath('home'), '.config', 'aorus-control');
    await fs.mkdir(configDir, { recursive: true });
    const configPath = path.join(configDir, 'settings.json');
    await fs.writeFile(configPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});