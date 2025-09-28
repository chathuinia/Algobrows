const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Создаем главное окно
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  // Загружаем интерфейс браузера
  mainWindow.loadFile('index.html');

  // Показываем окно когда готово
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Создаем BrowserView для веб-контента
  const browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.setBrowserView(browserView);
  
  // Настраиваем размер BrowserView
  updateBrowserViewSize();
  
  mainWindow.on('resize', () => {
    updateBrowserViewSize();
  });

  function updateBrowserViewSize() {
    const bounds = mainWindow.getBounds();
    browserView.setBounds({
      x: 0,
      y: 60, // Высота навигационной панели
      width: bounds.width,
      height: bounds.height - 60
    });
  }

  // Сохраняем ссылку на BrowserView
  mainWindow.browserView = browserView;

  // Обработчики IPC сообщений
  ipcMain.handle('navigate-to', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      browserView.webContents.loadURL(url);
    }
  });

  ipcMain.handle('go-back', () => {
    if (browserView.webContents.canGoBack()) {
      browserView.webContents.goBack();
    }
  });

  ipcMain.handle('go-forward', () => {
    if (browserView.webContents.canGoForward()) {
      browserView.webContents.goForward();
    }
  });

  ipcMain.handle('reload', () => {
    browserView.webContents.reload();
  });

  ipcMain.handle('get-url', () => {
    return browserView.webContents.getURL();
  });

  // Отслеживаем навигацию
  browserView.webContents.on('did-navigate', (event, navigationUrl) => {
    mainWindow.webContents.send('url-changed', navigationUrl);
  });

  browserView.webContents.on('did-navigate-in-page', (event, navigationUrl) => {
    mainWindow.webContents.send('url-changed', navigationUrl);
  });

  // Загружаем домашнюю страницу
  browserView.webContents.loadURL('https://www.google.com');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});