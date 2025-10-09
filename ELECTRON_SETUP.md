# Electron Desktop Setup

## Установка завершена! 

Все необходимые зависимости и файлы для Electron установлены.

## Структура файлов

- `electron/main.js` - главный процесс Electron
- `electron/preload.js` - preload скрипт для безопасности
- `electron-builder.json` - конфигурация сборки
- `scripts.json` - NPM скрипты (добавьте их в package.json)

## Скрипты для package.json

Добавьте следующие скрипты в ваш `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"cross-env NODE_ENV=development vite\" \"wait-on http://localhost:8080 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:build:win": "vite build && electron-builder --win",
    "electron:build:mac": "vite build && electron-builder --mac",
    "electron:build:linux": "vite build && electron-builder --linux"
  }
}
```

## Как использовать

### Разработка
```bash
npm run electron:dev
```

### Сборка для текущей платформы
```bash
npm run electron:build
```

### Сборка для конкретной платформы
```bash
npm run electron:build:win   # Windows
npm run electron:build:mac   # macOS
npm run electron:build:linux # Linux
```

## Иконки приложения

Создайте папку `build/` в корне проекта и добавьте иконки:
- `icon.icns` - для macOS
- `icon.ico` - для Windows
- `icon.png` - для Linux (512x512 px)

## Примечания

- В режиме разработки открывается DevTools
- Приложение использует безопасный contextBridge
- Все настройки оптимизированы для продакшена
- Supabase и все функции работают в десктопной версии
