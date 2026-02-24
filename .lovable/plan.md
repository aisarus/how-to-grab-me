

## Сохранение оригинального языка промпта

### Проблема
Сейчас ассистент принудительно отвечает на языке интерфейса (UI language), потому что в системном промпте есть строка `Respond in ${languageName}`. Если пользователь пишет промпт на английском, но интерфейс на русском -- ассистент отвечает по-русски, что неправильно.

### Решение
Изменить инструкцию в системном промпте edge-функции `prompt-assistant`, чтобы ассистент определял язык по тексту промпта пользователя, а не по настройке интерфейса.

### Технические изменения

**Файл: `supabase/functions/prompt-assistant/index.ts`**

Заменить строку:

```
Respond in ${languageName}. Be friendly and constructive.
```

На:

```
IMPORTANT: Always respond in the same language that the user writes their prompt in. 
If the user writes in English, respond in English. If in Russian, respond in Russian. 
If in Hebrew, respond in Hebrew. Match the user's language exactly. Be friendly and constructive.
```

Это единственное изменение -- параметр `language` из UI больше не будет влиять на язык ответа ассистента. Язык будет автоматически определяться по тексту пользователя.

