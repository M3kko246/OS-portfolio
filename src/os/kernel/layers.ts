/**
 * Every z-index in the project. tokens.css exposes them as `--z-<name>`; nothing else may set a
 * z-index. Windows live inside the `windows` layer and stack by their index in the window order.
 */
export const layers = {
  wallpaper: 0,
  icons: 10,
  windows: 20,
  snapPreview: 30,
  taskbar: 50,
  windowAnimation: 55,
  menu: 60,
  toast: 70,
  crt: 80,
  shutdown: 90,
  boot: 100,
} as const;

export type Layer = keyof typeof layers;
