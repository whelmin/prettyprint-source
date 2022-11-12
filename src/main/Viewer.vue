<template>
  <div ref="el" class="prettyprint-source__viewer" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Editor, EditorOptions, Monaco } from './useMonaco';
import type { SourceInfo } from '../content-scripts';

const el = ref<HTMLInputElement | null>(null);

let editor: null | Editor = null;

/**
 * Get monaco editor options and settings
 */
async function getOptions() {
  return new Promise<EditorOptions>((resolve) => {
    chrome.storage.local.get('settings', (state) => {
      const {
        theme,
        fontFamily,
        fontSize,
        wordWrap,
      } = state.settings || {};
      resolve({
        theme: theme || 'vs',
        fontFamily,
        fontSize,
        wordWrap: wordWrap || 'on',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        contextmenu: false,
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        snippetSuggestions: 'none',
        copyWithSyntaxHighlighting: false,
        codeLens: false,
        ...(state.settings || {}),
      });
    });
  });
}

/**
 * Get source language
 */
function getLanguage(monaco: Monaco, sourceInfo: SourceInfo) {
  const { filename, contentType } = sourceInfo;
  const supportedLanguages = monaco.languages.getLanguages();
  const supportedLanguageIds = supportedLanguages.map((lang) => lang.id);
  // get lang by content-type
  let language: string = '';
  if (contentType) {
    const mimeSubtype = /.*\/([^;]*)/.exec(contentType)?.[1] || '';
    if (supportedLanguageIds.includes(mimeSubtype)) {
      language = mimeSubtype;
    }
  }
  // get lang by filename
  if (!language) {
    monaco.languages.getLanguages().forEach((languages) => {
      languages.extensions?.forEach((monacoExtension) => {
        if (filename.endsWith(monacoExtension)) {
          language = languages.id;
        }
      });
    });
  }
  return language;
}

/**
 * Init monaco editor
 */
async function initMonaco(sourceInfo: SourceInfo) {
  if (!el.value) return;

  const { useMonaco } = await import('./useMonaco');
  const monaco = await useMonaco();
  if (!monaco) return;

  const options = await getOptions();
  editor = monaco.editor.create(el.value, {
    ...options,
    value: sourceInfo.text,
    language: getLanguage(monaco, sourceInfo),
  });

  // formatDocument
  setTimeout(() => {
    editor?.getAction('editor.action.formatDocument').run()
      .then(() => {
        editor?.updateOptions({
          readOnly: true,
          domReadOnly: true,
        });
      });
  }, 500);
}

/**
 * Update monaco editor options by settings
 */
async function updateMonaco() {
  const options = await getOptions();
  editor?.updateOptions(options);
}

// window resize
window.addEventListener('resize', () => {
  editor?.layout();
});

/**
 * Listen to message from the content script
 */
window.addEventListener('message', async (event) => {
  const { name, data } = event.data;
  if (name === 'init' && typeof data.text !== 'undefined') {
    initMonaco(data);
  }
  if (name === 'update') {
    updateMonaco();
  }
});

/**
 * Send loaded message to the content script
 */
window.parent.postMessage('loaded', '*');
</script>

<style lang="less">
.prettyprint-source__viewer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  &__monaco {
    width: 100%;
    height: 100%;
  }
}
</style>
