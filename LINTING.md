# Linting & Formatting — Документація

> Остання міграція: **Червень 2026**
> ESLint v8 (.eslintrc, airbnb-base) → ESLint v9 (eslint.config.mjs, airbnb-extended)

---

## Зміст

- [Стек інструментів](#стек-інструментів)
- [Архітектура ESLint Flat Config](#архітектура-eslint-flat-config)
- [Взаємодія ESLint та Prettier](#взаємодія-eslint-та-prettier)
- [Кастомні правила проєкту](#кастомні-правила-проєкту)
- [Команди](#команди)
- [Майбутнє оновлення до ESLint v10+](#майбутнє-оновлення-до-eslint-v10)
- [Troubleshooting](#troubleshooting)

---

## Стек інструментів

| Інструмент | Версія | Призначення |
|---|---|---|
| **ESLint** | ^9.39.4 | Статичний аналіз коду (якість, помилки, best practices) |
| **eslint-config-airbnb-extended** | ^3.1.0 | Набір правил Airbnb Style Guide для Flat Config |
| **eslint-config-prettier** | ^10.1.5 | Вимикає правила ESLint, що конфліктують з Prettier |
| **globals** | ^16.2.0 | Визначення глобальних змінних середовища (browser, node) |
| **typescript** | ^6.0.3 | Peer-залежність `airbnb-extended` (для `typescript-eslint`) |
| **Prettier** | (VS Code extension) | Форматування коду (відступи, лапки, крапки з комою тощо) |

### Чому ESLint v9, а не v10?

На момент міграції (червень 2026) пакет `eslint-config-airbnb-extended` v3.1.0 має
peer dependency `eslint: ^9.0.0`. ESLint v10 не сумісний і викликає runtime-помилки.
Відслідковується в [Issue #65](https://github.com/eslint-config/airbnb-extended/issues/65).

---

## Архітектура ESLint Flat Config

Файл `eslint.config.mjs` експортує **масив конфіг-об'єктів**. Порядок має значення —
кожен наступний об'єкт може перевизначати правила попередніх.

```
┌──────────────────────────────────────────────────────┐
│  1. ignores                                          │
│     Глобальне ігнорування: node_modules/, .idea/     │
├──────────────────────────────────────────────────────┤
│  2. plugins.importX                                  │
│     Реєстрація плагіна eslint-plugin-import-x        │
│  3. plugins.stylistic                                │
│     Реєстрація плагіна @stylistic/eslint-plugin      │
├──────────────────────────────────────────────────────┤
│  4. ...configs.base.recommended                      │
│     11 конфіг-об'єктів Airbnb:                       │
│     • best-practices — запобігання типовим помилкам   │
│     • errors — правила обробки помилок               │
│     • es6 — правила ES6+ синтаксису                  │
│     • import-x — правила імпортів/експортів          │
│     • strict — strict mode                           │
│     • style — стиль коду                             │
│     • stylistic — @stylistic правила форматування    │
│     • variables — правила для змінних                │
│     • base-configurations — базові налаштування       │
│     • base-settings — налаштування для JS-файлів     │
│     • disable-legacy-stylistic — вимкнення legacy    │
├──────────────────────────────────────────────────────┤
│  5. prettier                                         │
│     eslint-config-prettier — вимикає ВСІ правила     │
│     ESLint, що конфліктують з Prettier                │
├──────────────────────────────────────────────────────┤
│  6. Кастомні правила проєкту                         │
│     languageOptions.globals + власні rules overrides  │
└──────────────────────────────────────────────────────┘
```

### Важливо: чому саме configs.base.recommended?

Пакет `eslint-config-airbnb-extended` надає кілька пресетів:

| Пресет | Опис |
|---|---|
| `configs.base.recommended` | Тільки JavaScript правила (11 конфігів) |
| `configs.base.typescript` | TypeScript-специфічні правила (7 конфігів) |
| `configs.base.all` | JS + TypeScript разом (18 конфігів) |
| `configs.react.*` | React-проєкти |
| `configs.node.*` | Node.js-проєкти |
| `configs.next.*` | Next.js-проєкти |

Оскільки проєкт — чистий JavaScript, використовується `configs.base.recommended`.

### Чому потрібна окрема реєстрація плагінів?

`configs.base.recommended` містить **правила**, що посилаються на плагіни `import-x`
та `@stylistic`, але **не реєструє** самі плагіни. Це архітектурне рішення
`airbnb-extended` — плагіни реєструються окремо через `plugins.importX` та
`plugins.stylistic`.

Без їхньої реєстрації ESLint видасть помилку:
```
A configuration object specifies rule "import-x/default",
but could not find plugin "import-x".
```

---

## Взаємодія ESLint та Prettier

### Розподіл відповідальності

ESLint та Prettier вирішують **різні задачі** і не повинні конфліктувати:

```
┌─────────────────────────────────────────────────────────────┐
│                    ЯКІСТЬ КОДУ (ESLint)                      │
│                                                             │
│  • no-unused-vars         — невикористані змінні            │
│  • no-console             — console.log у продакшені        │
│  • prefer-const           — const замість let               │
│  • no-param-reassign      — мутація параметрів функцій      │
│  • import-x/no-duplicates — дублікати імпортів              │
│  • eqeqeq                 — === замість ==                  │
│  • ...та сотні інших правил                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 ФОРМАТУВАННЯ (Prettier)                      │
│                                                             │
│  • Відступи (2 пробіли)                                     │
│  • Крапки з комою (вимкнені: semi: false)                   │
│  • Лапки (одинарні: singleQuote: true)                      │
│  • Довжина рядка (120 символів: printWidth: 120)            │
│  • Trailing commas (вимкнені: trailingComma: "none")        │
│  • Переноси рядків, дужки, пробіли тощо                     │
└─────────────────────────────────────────────────────────────┘
```

### Проблема: конфлікт правил

Деякі правила ESLint також контролюють форматування (наприклад, `semi`, `quotes`,
`indent`, `@stylistic/*`). Це створює конфлікт: ESLint каже "додай крапку з комою",
а Prettier — "видали".

### Рішення: eslint-config-prettier

Пакет `eslint-config-prettier` — це конфіг-об'єкт, що **вимикає всі правила ESLint,
які конфліктують з Prettier**. Він не додає нових правил — тільки ставить `"off"` на
конфліктуючі.

**Як це працює під капотом:**

```javascript
// eslint-config-prettier внутрішньо робить щось подібне:
export default {
  rules: {
    // Вимикає core ESLint formatting rules
    semi: 'off',
    quotes: 'off',
    indent: 'off',
    'comma-dangle': 'off',
    'arrow-parens': 'off',
    'object-curly-spacing': 'off',
    // ...

    // Вимикає @stylistic formatting rules
    '@stylistic/semi': 'off',
    '@stylistic/quotes': 'off',
    '@stylistic/indent': 'off',
    // ...ще ~100 правил
  }
}
```

**Чому `prettier` ОБОВ'ЯЗКОВО йде перед кастомними правилами (рядок 19)?**

```javascript
// eslint.config.mjs — порядок обробки:
export default [
  ...configs.base.recommended,  // 1. Airbnb вмикає semi: 'error'
  prettier,                      // 2. eslint-config-prettier ставить semi: 'off'
  {
    rules: {
      semi: ['error', 'never'], // 3. Наш кастом: semi помилка якщо є крапка з комою
    }
  }
]
```

У нашому випадку `prettier` стоїть перед кастомними правилами. Це означає:
1. Airbnb вмикає `semi: ['error', 'always']`
2. `eslint-config-prettier` вимикає його: `semi: 'off'`
3. Наш кастомний блок **знову вмикає** `semi: ['error', 'never']`

Це коректно, бо наше правило `semi: ['error', 'never']` не конфліктує з Prettier
(Prettier теж вимикає крапки з комою: `"semi": false`).

### Потік перевірки коду

```
Файл збережено
    │
    ▼
┌─────────┐     ┌──────────┐
│ Prettier │────▶│ ESLint   │
│ (format) │     │ (analyze)│
└─────────┘     └──────────┘
    │                │
    ▼                ▼
Форматування    Помилки якості
застосовано     показані в IDE
```

**VS Code workflow:**
1. При збереженні файлу Prettier форматує код (відступи, лапки, semi тощо)
2. ESLint перевіряє логіку та якість (невикористані змінні, помилки тощо)
3. Конфліктів немає, бо `eslint-config-prettier` вимкнув форматувальні правила ESLint

### Конфігурація Prettier (.prettierrc)

```json
{
  "semi": false,           // Без крапок з комою
  "trailingComma": "none", // Без trailing commas
  "singleQuote": true,     // Одинарні лапки
  "printWidth": 120        // Максимальна довжина рядка
}
```

Ці налаштування **узгоджені** з кастомними ESLint-правилами:
- `semi: false` ↔ `semi: ['error', 'never']`
- `singleQuote: true` ↔ `quotes: ['error', 'single']`

---

## Кастомні правила проєкту

Правила перенесені зі старого `.eslintrc` з адаптацією під новий стек:

| Правило | Значення | Пояснення |
|---|---|---|
| `linebreak-style` | `['error', 'windows']` | CRLF закінчення рядків (Windows) |
| `semi` | `['error', 'never']` | Без крапок з комою (узгоджено з Prettier) |
| `quotes` | `['error', 'single']` | Одинарні лапки (узгоджено з Prettier) |
| `indent` | `['error', 2]` | 2 пробіли відступу |
| `no-console` | `'off'` | Дозволяє console.log (навчальний проєкт) |
| `no-unused-vars` | Ігнорує `^_` | Невикористані змінні з `_` на початку дозволені |
| `no-debugger` | `'warn'` | Попередження замість помилки |
| `import-x/extensions` | `'off'` | Не вимагає розширень файлів в імпортах |
| `import-x/prefer-default-export` | `'off'` | Дозволяє named exports |

### Міграція import/ → import-x/

При переході з `eslint-plugin-import` на `eslint-plugin-import-x` (через
`airbnb-extended`), всі правила з префіксом `import/` замінені на `import-x/`:

```diff
- 'import/extensions': 'off'
+ 'import-x/extensions': 'off'
- 'import/prefer-default-export': 'off'
+ 'import-x/prefer-default-export': 'off'
```

---

## Команди

```bash
# Перевірити код (показати помилки)
yarn lint

# Перевірити та автоматично виправити
yarn lint:fix

# Еквівалент через npx
npx eslint .
npx eslint . --fix
```

---

## Майбутнє оновлення до ESLint v10+

### Передумови

Перед оновленням перевірте:

1. **Сумісність `eslint-config-airbnb-extended`:**
   ```bash
   npm view eslint-config-airbnb-extended peerDependencies --json
   ```
   Якщо peer dependency змінився на `eslint: ^10.0.0` або `eslint: >=9.0.0` —
   можна оновлювати.

2. **Issue tracker:**
   [github.com/eslint-config/airbnb-extended/issues/65](https://github.com/eslint-config/airbnb-extended/issues/65)

### Кроки оновлення

```bash
# 1. Оновити ESLint та airbnb-extended
yarn add -D eslint@latest eslint-config-airbnb-extended@latest

# 2. Оновити eslint-config-prettier (якщо потрібно)
yarn add -D eslint-config-prettier@latest

# 3. Оновити globals (якщо потрібно)
yarn add -D globals@latest

# 4. Перевірити, що конфіг працює
yarn lint

# 5. Автофікс нових правил
yarn lint:fix
```

### Що може зламатися при ESLint v10

| Потенційна проблема | Рішення |
|---|---|
| `eslint-config-airbnb-extended` не підтримує v10 | Чекати оновлення пакету, або використовувати `--force` (на свій ризик) |
| Нові deprecated правила | ESLint виведе попередження — замінити на рекомендовані |
| Видалені правила | Видалити з кастомних rules або замінити на аналоги |
| `/* eslint-env */` коментарі | Видалити — в ESLint v10 вони повністю заборонені (reported as errors) |
| Зміни в API плагінів | Оновити `eslint-config-airbnb-extended` до версії з підтримкою v10 |

### Перевірка сумісності перед оновленням

```bash
# Подивитися, яку версію ESLint очікує airbnb-extended
npm view eslint-config-airbnb-extended@latest peerDependencies

# Подивитися всі доступні версії airbnb-extended
npm view eslint-config-airbnb-extended versions --json

# Перевірити, чи є бета з підтримкою v10
npm view eslint-config-airbnb-extended@next peerDependencies
```

---

## Troubleshooting

### "Could not find plugin 'import-x'"

Переконайтесь, що `plugins.importX` та `plugins.stylistic` зареєстровані
**перед** `...configs.base.recommended` у `eslint.config.mjs`.

### "Cannot find module 'typescript'"

`eslint-config-airbnb-extended` залежить від `typescript-eslint`, який вимагає
`typescript` як peer dependency. Навіть для JS-only проєкту потрібно:
```bash
yarn add -D typescript
```

### Конфлікт ESLint і Prettier

Якщо ESLint і Prettier дають протилежні вказівки:
1. Перевірте, що `prettier` стоїть **після** `...configs.base.recommended`
   у масиві `eslint.config.mjs`
2. Переконайтесь, що кастомні правила (semi, quotes) **узгоджені** з `.prettierrc`
3. Запустіть перевірку конфліктів:
   ```bash
   npx eslint-config-prettier eslint.config.mjs
   ```

### linebreak-style помилки після створення файлу

Файли, створені інструментами (не редактором), можуть мати LF замість CRLF.
Виправляється автоматично:
```bash
yarn lint:fix
```
