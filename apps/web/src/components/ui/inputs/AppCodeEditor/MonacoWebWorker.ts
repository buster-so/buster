'use client';

if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorker(moduleId, label) {
      switch (label) {
        case 'editorWorkerService':
          return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
        case 'json':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url)
          );
        case 'yaml':
          return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
        default:
          throw new Error(`Unknown label ${label}`);
      }
    }
  };
}
