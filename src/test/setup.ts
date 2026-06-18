declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (typeof globalThis.DragEvent === 'undefined') {
  globalThis.DragEvent = MouseEvent as typeof DragEvent;
}

export {};
