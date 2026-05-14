// Utilidad para concatenar clases de CSS de forma segura
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
