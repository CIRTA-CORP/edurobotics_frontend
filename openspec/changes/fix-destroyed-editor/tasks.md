# Tasks — El editor de contenido deja de romperse

## 1. Arreglo

- [x] 1.1 El efecto de sincronización no toca una instancia destruida
- [x] 1.2 La barra de herramientas: comprobado que sus llamadas no lanzan con una
      instancia destruida (devuelven `false`), así que no se toca
- [x] 1.3 El guardado usa el último HTML conocido si la instancia está destruida

## 2. Verificación

- [x] 2.1 Comprobar que `isDestroyed` es exactamente la condición en la que
      `getHTML()` lanza el error de producción
- [x] 2.2 Build de producción y ESLint sin hallazgos nuevos
- [ ] 2.3 **En producción, tras desplegar:** repetir el recorrido que fallaba
      (entrar al taller, abrir un curso) — lo hace Mario, porque requiere sesión
      de administrador

## 3. Cierre

- [ ] 3.1 Volcar el delta en `openspec/specs/` y archivar
