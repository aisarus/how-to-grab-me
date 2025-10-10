# 🚀 Создание Desktop-приложения с Electron

Полное руководство по превращению TRI/TFM Optimizer в полноценное desktop-приложение для Windows, macOS и Linux с установщиками.

## 📋 Содержание

1. [Введение](#введение)
2. [Требования](#требования)
3. [Подготовка проекта](#подготовка-проекта)
4. [Установка зависимостей](#установка-зависимостей)
5. [Настройка Electron](#настройка-electron)
6. [Разработка](#разработка)
7. [Сборка установщиков](#сборка-установщиков)
8. [Создание иконок](#создание-иконок)
9. [Подписывание приложения](#подписывание-приложения)
10. [Решение проблем](#решение-проблем)

---

## 🎯 Введение

Ваше приложение TRI/TFM Optimizer уже настроено для работы с Electron! Все необходимые конфигурационные файлы готовы:

- ✅ `electron/main.js` - главный процесс Electron
- ✅ `electron/preload.js` - безопасный preload скрипт
- ✅ `electron-builder.json` - конфигурация сборки установщиков
- ✅ `vite.config.ts` - настроен для Electron

## 💻 Требования

### Общие требования:
- **Node.js** версии 18 или выше
- **npm** или **yarn**
- Минимум **4 GB RAM** для сборки
- **10 GB** свободного места на диске

### Для Windows (создание .exe):
- Windows 10/11
- Необязательно: сертификат для подписывания (Code Signing Certificate)

### Для macOS (создание .dmg):
- macOS 10.13 или выше
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer аккаунт для подписывания (опционально)

### Для Linux (создание .AppImage, .deb):
- Ubuntu 20.04+ или другой современный дистрибутив
- Установленные пакеты: `build-essential`, `libssl-dev`

---

## 🔧 Подготовка проекта

### 1. Экспорт из Lovable

1. Нажмите **GitHub** → **Connect to GitHub** в интерфейсе Lovable
2. Авторизуйте Lovable GitHub App
3. Создайте репозиторий
4. Клонируйте проект локально:

```bash
git clone <URL-вашего-репозитория>
cd <название-проекта>
```

### 2. Проверка файлов

Убедитесь, что присутствуют следующие файлы:

```
project-root/
├── electron/
│   ├── main.js          # ✅ Есть
│   └── preload.js       # ✅ Есть
├── electron-builder.json # ✅ Есть
├── scripts.json         # ✅ Есть
├── package.json
└── vite.config.ts       # ✅ Настроен
```

---

## 📦 Установка зависимостей

### Шаг 1: Установка основных пакетов

```bash
npm install
```

### Шаг 2: Проверка Electron-пакетов

Electron-пакеты уже должны быть в `package.json`:

```json
{
  "devDependencies": {
    "electron": "^38.2.2",
    "electron-builder": "^26.0.12",
    "concurrently": "^9.2.1",
    "cross-env": "^10.1.0",
    "wait-on": "^9.0.1"
  }
}
```

Если их нет, установите:

```bash
npm install --save-dev electron electron-builder concurrently cross-env wait-on
```

### Шаг 3: Добавление скриптов в package.json

Добавьте в `package.json` в секцию `scripts`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"cross-env NODE_ENV=development vite\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:build:win": "vite build && electron-builder --win",
    "electron:build:mac": "vite build && electron-builder --mac",
    "electron:build:linux": "vite build && electron-builder --linux",
    "electron:build:all": "vite build && electron-builder --win --mac --linux"
  }
}
```

---

## 🛠️ Настройка Electron

### Конфигурация electron-builder.json

Файл `electron-builder.json` уже настроен, но вы можете его кастомизировать:

```json
{
  "appId": "com.tritfm.app",
  "productName": "TRI/TFM Optimizer",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      },
      "portable"
    ],
    "icon": "build/icon.ico",
    "publisherName": "Your Company Name",
    "verifyUpdateCodeSignature": false
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "TRI/TFM Optimizer",
    "perMachine": false,
    "deleteAppDataOnUninstall": false,
    "license": "LICENSE.txt"
  },
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ],
    "window": {
      "width": 540,
      "height": 400
    }
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Utility",
    "maintainer": "your-email@example.com",
    "vendor": "Your Company Name",
    "synopsis": "TRI/TFM Prompt Optimizer",
    "description": "Advanced prompt optimization tool with TRI/TFM technology"
  }
}
```

### Важные параметры для Windows:

- `oneClick: false` - позволяет пользователю выбрать папку установки
- `allowToChangeInstallationDirectory: true` - кастомная папка установки
- `createDesktopShortcut: true` - создать ярлык на рабочем столе
- `perMachine: false` - установка для текущего пользователя (не требует прав администратора)

---

## 🎨 Создание иконок

### Требования к иконкам:

| Платформа | Формат | Размер | Файл |
|-----------|--------|--------|------|
| Windows | `.ico` | 256x256 | `build/icon.ico` |
| macOS | `.icns` | 512x512, 1024x1024 | `build/icon.icns` |
| Linux | `.png` | 512x512 | `build/icon.png` |

### Создание структуры папок:

```bash
mkdir -p build
```

### Способы создания иконок:

#### Вариант 1: Онлайн-конвертеры (самый простой)

1. **ICO (Windows)**: 
   - https://www.icoconverter.com/
   - Загрузите PNG 256x256 или больше
   - Скачайте как `icon.ico`

2. **ICNS (macOS)**:
   - https://cloudconvert.com/png-to-icns
   - Загрузите PNG 1024x1024
   - Скачайте как `icon.icns`

3. **PNG (Linux)**:
   - Просто сохраните PNG 512x512 как `icon.png`

#### Вариант 2: Imagemagick (для разработчиков)

```bash
# Установка (macOS)
brew install imagemagick

# Установка (Ubuntu/Debian)
sudo apt-get install imagemagick

# Создание ICO из PNG
convert icon-256.png -define icon:auto-resize=256,128,96,64,48,32,16 build/icon.ico

# Создание PNG нужного размера
convert original.png -resize 512x512 build/icon.png
```

#### Вариант 3: Electron-icon-builder (автоматизация)

```bash
# Установка
npm install --save-dev electron-icon-builder

# Создание всех иконок из одного PNG
npx electron-icon-builder --input=./source-icon.png --output=./build --flatten
```

### Проверка иконок:

```bash
ls -lh build/
# Должны быть:
# icon.ico (Windows)
# icon.icns (macOS)
# icon.png (Linux)
```

---

## 🏃 Разработка

### Запуск в режиме разработки:

```bash
npm run electron:dev
```

Это запустит:
1. Vite dev server на `http://localhost:8080`
2. Electron окно с автоперезагрузкой при изменении кода

### Что происходит в dev-режиме:

- ✅ Hot Module Replacement (HMR) работает
- ✅ DevTools открыты автоматически
- ✅ Изменения в React-коде применяются мгновенно
- ✅ Supabase подключение работает
- ✅ Изменения в `electron/main.js` требуют перезапуска

### Горячие клавиши в Dev Mode:

- `Ctrl+R` (Cmd+R) - перезагрузить окно
- `Ctrl+Shift+I` (Cmd+Option+I) - открыть DevTools
- `Ctrl+Q` (Cmd+Q) - закрыть приложение

---

## 📤 Сборка установщиков

### Для текущей платформы:

```bash
npm run electron:build
```

### Для конкретной платформы:

#### Windows (создать .exe установщик):
```bash
npm run electron:build:win
```

**Результат:**
```
release/
├── TRI-TFM Optimizer Setup 1.0.0.exe    # Установщик
├── TRI-TFM Optimizer 1.0.0.exe          # Portable версия
└── win-unpacked/                        # Распакованная версия для тестирования
```

#### macOS (создать .dmg):
```bash
npm run electron:build:mac
```

**Результат:**
```
release/
├── TRI-TFM Optimizer-1.0.0.dmg          # Установщик
├── TRI-TFM Optimizer-1.0.0-mac.zip      # ZIP архив
└── mac/                                 # .app файл
```

#### Linux (создать .AppImage и .deb):
```bash
npm run electron:build:linux
```

**Результат:**
```
release/
├── TRI-TFM Optimizer-1.0.0.AppImage     # Universal Linux (запускается везде)
├── tri-tfm-optimizer_1.0.0_amd64.deb    # Debian/Ubuntu пакет
└── linux-unpacked/                      # Распакованная версия
```

### Сборка для всех платформ (требует соответствующей ОС):

```bash
npm run electron:build:all
```

⚠️ **Важно:** Нельзя собрать macOS .dmg на Windows или Linux. Для кросс-платформенной сборки используйте CI/CD или виртуальные машины.

---

## 🔐 Подписывание приложения

### Windows Code Signing

#### Получение сертификата:

1. Купите Code Signing Certificate у доверенного CA:
   - DigiCert
   - Sectigo
   - GlobalSign
   - Стоимость: $100-$500/год

2. Сохраните сертификат как `.pfx` или `.p12` файл

#### Настройка подписывания:

Добавьте в `electron-builder.json`:

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

**Безопасность:** Не храните пароль в Git! Используйте переменные окружения:

```json
{
  "win": {
    "certificateFile": "certs/certificate.pfx",
    "certificatePassword": "${env.CERT_PASSWORD}"
  }
}
```

Затем при сборке:

```bash
export CERT_PASSWORD="your-password"
npm run electron:build:win
```

### macOS Code Signing

#### Требования:

1. **Apple Developer аккаунт** ($99/год)
2. **Developer ID Application Certificate**
3. **App-specific password** для нотаризации

#### Настройка:

Добавьте в `electron-builder.json`:

```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "afterSign": "scripts/notarize.js"
}
```

Создайте `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
```

---

## 🐛 Решение проблем

### Проблема: "Electron не запускается"

**Решение:**
```bash
# Очистите кеш
rm -rf node_modules
rm package-lock.json

# Переустановите
npm install

# Пересоберите native модули
npm rebuild
```

### Проблема: "White screen в Electron окне"

**Причины:**
1. Vite dev server не запустился
2. Неправильный путь к `dist/index.html`

**Решение:**
- Проверьте `electron/main.js` - путь должен быть:
  ```javascript
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  ```
- В `vite.config.ts` должно быть `base: "./"` в production mode

### Проблема: "Supabase не работает в production build"

**Решение:**
Убедитесь, что в `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "./" : "/",
  // ...
}))
```

И в `.env` переменные присутствуют.

### Проблема: "Сборка для Windows зависает"

**Решение:**
```bash
# Отключите антивирус временно
# Или добавьте папку проекта в исключения

# Увеличьте лимит памяти Node.js
set NODE_OPTIONS=--max-old-space-size=4096
npm run electron:build:win
```

### Проблема: "Не находятся файлы в собранном приложении"

**Решение:**
Проверьте `electron-builder.json` → `files`:

```json
{
  "files": [
    "dist/**/*",           // ✅ Обязательно
    "electron/**/*",       // ✅ Обязательно
    "package.json",        // ✅ Обязательно
    "!**/node_modules/**"  // Исключить node_modules
  ]
}
```

### Проблема: "macOS говорит 'поврежденное приложение'"

**Причина:** Приложение не подписано

**Временное решение:**
```bash
xattr -cr "/Applications/TRI-TFM Optimizer.app"
```

**Правильное решение:** Подпишите приложение (см. раздел выше)

### Проблема: "NSIS ошибка при сборке Windows установщика"

**Решение:**
```bash
# Установите NSIS вручную
# Windows: скачайте с https://nsis.sourceforge.io/

# Или используйте portable версию вместо NSIS
```

В `electron-builder.json`:
```json
{
  "win": {
    "target": ["portable"]  // Вместо "nsis"
  }
}
```

---

## 📊 Размеры приложения

Типичные размеры после сборки:

| Платформа | Установщик | Установленное |
|-----------|-----------|---------------|
| Windows .exe (installer) | ~80 MB | ~180 MB |
| Windows .exe (portable) | ~110 MB | - |
| macOS .dmg | ~90 MB | ~200 MB |
| Linux .AppImage | ~95 MB | ~200 MB |
| Linux .deb | ~85 MB | ~190 MB |

Почему такие размеры?
- Electron runtime: ~50 MB
- Chromium engine: ~100 MB  
- Node.js: ~20 MB
- Ваше приложение: ~10-20 MB

---

## 🚀 Оптимизация размера

### 1. Используйте сжатие

В `electron-builder.json`:

```json
{
  "compression": "maximum",
  "asarUnpack": [
    "node_modules/sharp/**/*"  // Распаковать только критичные модули
  ]
}
```

### 2. Исключите dev-зависимости

```json
{
  "files": [
    "dist/**/*",
    "electron/**/*",
    "!**/node_modules/*/{CHANGELOG.md,README.md,*.ts,*.map}"
  ]
}
```

### 3. Оптимизируйте Vite build

В `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Удалить console.log в production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
```

---

## 📝 Чек-лист перед релизом

- [ ] Все иконки созданы (ico, icns, png)
- [ ] Версия в `package.json` обновлена
- [ ] `productName` и `appId` настроены в `electron-builder.json`
- [ ] Приложение протестировано в dev режиме
- [ ] Production build протестирован локально
- [ ] Supabase подключение работает
- [ ] Создан `LICENSE.txt` (если нужен для NSIS)
- [ ] Обновлен `README.md` с инструкциями для пользователей
- [ ] Сертификаты для подписывания готовы (если нужно)
- [ ] Auto-update настроен (если планируется)

---

## 🔄 Автоматические обновления (опционально)

### Настройка с GitHub Releases

1. Добавьте в `electron-builder.json`:

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  ]
}
```

2. В `electron/main.js`:

```javascript
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

3. Публикация релиза:

```bash
# Создайте GitHub token
export GH_TOKEN="your-github-token"

# Соберите и опубликуйте
npm run electron:build -- --publish always
```

---

## 📚 Полезные ресурсы

- **Electron документация**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **Electron Forge** (альтернатива): https://www.electronforge.io/
- **Awesome Electron**: https://github.com/sindresorhus/awesome-electron

---

## 💬 Поддержка

Если возникли проблемы:

1. Проверьте раздел [Решение проблем](#решение-проблем)
2. Посмотрите Issues на GitHub: https://github.com/electron/electron/issues
3. Electron Discord: https://discord.gg/electron
4. Stack Overflow: тег `[electron]`

---

## 🎉 Готово!

Теперь у вас есть полноценное desktop-приложение с установщиками для всех платформ!

**Быстрый старт:**
```bash
# Разработка
npm run electron:dev

# Сборка для Windows
npm run electron:build:win

# Результат в папке:
ls release/
```

**Удачи в разработке! 🚀**
