import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

export type Monaco = typeof monacoEditor;
export type Editor = monacoEditor.editor.IStandaloneCodeEditor;
export type EditorOptions = monacoEditor.editor.IStandaloneEditorConstructionOptions;

const require = window.require as any;

require.config({
  paths: {
    vs: chrome.runtime.getURL('/lib/monaco-editor/min/vs'),
  },
});

// global config monaco
function configMonaco(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
    noSuggestionDiagnostics: true,
  });
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: false,
  });
  monaco.languages.css.cssDefaults.setOptions({
    validate: false,
  });
  monaco.languages.html.htmlDefaults.setOptions({});
}

const useMonaco = (): Promise<Monaco> => new Promise((resolve) => {
  // eslint-disable-next-line import/no-dynamic-require
  require(['vs/editor/editor.main'], () => {
    const { monaco } = window as any & { monaco: Monaco };
    configMonaco(monaco);
    resolve(monaco);
  });
});

export {
  useMonaco,
};
