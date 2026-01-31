# Cómo traducir textos (i18n)

Los textos visibles en la app se llaman **cadenas de traducción** (o *strings* en inglés). Es correcto llamarlos *strings* en desarrollo: son fragmentos de texto que se traducen según el idioma del usuario.

## Dónde están las traducciones

- **Inglés:** `en/translation.json`
- **Español:** `es/translation.json`

Cada archivo tiene la misma estructura de claves; solo cambia el valor en cada idioma.

## Cómo añadir o editar una traducción

### 1. Encontrar la clave en el código

En los componentes se usa `t('clave.de.subclave')`. Ejemplo:

```tsx
{t('components.registerForm.passwordMinLength')}
```

La clave es `components.registerForm.passwordMinLength`.

### 2. Editar el JSON del idioma

En `en/translation.json` y `es/translation.json`, localiza la sección (por ejemplo `components` → `registerForm`) y añade o modifica la clave:

**en/translation.json:**
```json
"registerForm": {
  "passwordMinLength": "Password must be at least 8 characters long",
  ...
}
```

**es/translation.json:**
```json
"registerForm": {
  "passwordMinLength": "La contraseña debe tener al menos 8 caracteres",
  ...
}
```

### 3. Usar la clave en el código

En el componente, con `useTranslation()`:

```tsx
const { t } = useTranslation();
// ...
<span>{t('components.registerForm.passwordMinLength')}</span>
```

## Añadir una clave nueva

1. Elige un nombre de clave descriptivo, por ejemplo `components.registerForm.miNuevaClave`.
2. Añade la misma clave en **ambos** archivos (`en/translation.json` y `es/translation.json`) con el texto en cada idioma.
3. En el componente, sustituye el texto fijo por `{t('components.registerForm.miNuevaClave')}`.

## Estructura habitual de claves

- `common.*` – textos comunes (Cancel, Save, Close, etc.)
- `app.*` – nombre de la app
- `pages.*` – títulos y textos de cada página
- `components.*` – textos de componentes (formularios, modales, etc.)
- `enums.*` – etiquetas de enumeraciones (estados, sabores, etc.)

## Interpolación (valores variables)

Si el texto incluye un valor dinámico:

**JSON:** `"helloUser": "Hello, {{name}}!"`

**Código:** `t('helloUser', { name: user.name })`

Resultado: "Hello, Ana!"
