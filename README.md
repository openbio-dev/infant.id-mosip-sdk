<h1 align="center">
  <br>
  <a href="https://github.com/openbio-dev/openbio-components">Openbio Components</a>
  <br>
</h1>

<h4 align="center">Componentes do pacote openbio-view-components</h4>

## Instalação
Siga os passos a baixo para instalação da biblioteca em seu projeto.

### Via CDN (Es Modules)

1. Em seu arquivo `index.html` adicione as seguintes entradas:
```html
<html>
  <head>
    <!-- HEAD Content -->
    <!-- Substitua VERSION com o valor desejado. Por exemplo 1.0, 1.x, etc -->
    <link href="https://cdn.jsdelivr.net/gh/openbio-dev/openbio-components@<VERSION>/dist/openbio-components.css" rel="stylesheet" />
  </head>
  <body>
    <!-- BODY Content -->
    <!-- Substitua VERSION com o valor desejado. Por exemplo 1.0, 1.x, etc -->
    <script src="https://cdn.jsdelivr.net/gh/openbio-dev/openbio-components@<VERSION>/dist/loader/index.js"></script>
  </body>
</html>
```

2. Em seu arquivo `main.js` importe a função `defineCustomElements` como no exemplo:

```js
import { defineCustomElements } from 'openbio-components/dist/loader';

defineCustomElements(window);
```

### Via CDN (HTML puro/ sem frameworks javascript)

```html
<html>
  <head>
    <!-- HEAD Content -->
    <!-- Substitua VERSION com o valor desejado. Por exemplo 1.0, 1.x, etc -->
    <link href="https://cdn.jsdelivr.net/gh/openbio-dev/openbio-components@<VERSION>/dist/openbio-components.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/gh/openbio-dev/openbio-components@<VERSION>/dist/openbio-components.js"></script>
  </head>
  <body>
    <!-- BODY Content -->
    <!-- Importe o componente que desejar -->
  </body>
</html>
```

### Via NPM

```bash
npm install openbio-components
# or yarn add openbio-components
```

Em seu arquivo `main.js` importe a função `defineCustomElements` como no exemplo:

```js
import { defineCustomElements } from 'openbio-components/dist/loader';

defineCustomElements(window);
```