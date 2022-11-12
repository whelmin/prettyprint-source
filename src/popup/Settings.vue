<template>
  <n-card
    class="prettyprint-source__settings"
    title="Prettyprint Source"
    closable
    @close="closeSettings"
  >
    <n-form
      v-if="settingsForm"
      class="settings__form"
      size="small"
      label-placement="left"
      label-align="left"
      label-width="100px"
    >
      <!-- Enable -->
      <n-form-item
        label="Enable"
      >
        <n-switch
          v-model:value="enable"
          size="small"
          @update:value="setEnable"
        />
      </n-form-item>
      <!-- formItems -->
      <n-collapse-transition :show="enable">
        <n-form-item
          v-for="item in formItems"
          :key="item.name"
          :label="item.name"
        >
          <n-select
            v-model:value="settingsForm[item.key]"
            size="small"
            :options="item.options"
            @update:value="setSettings"
          />
        </n-form-item>
      </n-collapse-transition>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  NCard,
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NCollapseTransition,
} from 'naive-ui';
import type { SelectOption } from 'naive-ui';

export interface Settings {
  theme: string,
  fontFamily: string,
  fontSize: number,
  wordWrap: string,
}

export interface FormItem {
  name: string,
  key: keyof Settings,
  options?: SelectOption[],
  defaultValue?: Settings[keyof Settings],
}

/**
 * Page Config
 */
// themeOptions
const themeOptions: SelectOption[] = [
  {
    label: 'Visual Studio',
    value: 'vs',
  },
  {
    label: 'Visual Studio Dark',
    value: 'vs-dark',
  },
  {
    label: 'High Contrast Light',
    value: 'hc-light',
  },
  {
    label: 'High Contrast Dark',
    value: 'hc-black',
  },
];

// fontFamilyOptions
const fontFamilyOptions: SelectOption[] = [
  {
    label: 'Default',
    value: 'Consolas, "Courier New", monospace',
  },
  {
    label: 'Monaco',
    value: 'Monaco',
  },
  {
    label: 'Menlo',
    value: 'Menlo',
  },
];

// fontSizeOptions
const fontSizeOptions: SelectOption[] = [
  {
    label: '12',
    value: 12,
  },
  {
    label: '13',
    value: 13,
  },
  {
    label: '14',
    value: 14,
  },
  {
    label: '15',
    value: 15,
  },
  {
    label: '16',
    value: 16,
  },
];

// wordWrapOptions
const wordWrapOptions: SelectOption[] = [
  {
    label: 'On',
    value: 'on',
  },
  {
    label: 'Off',
    value: 'off',
  },
];

const formItems = ref<FormItem[]>([
  {
    name: 'Theme',
    key: 'theme',
    options: themeOptions,
    defaultValue: 'vs',
  },
  {
    name: 'Font Family',
    key: 'fontFamily',
    options: fontFamilyOptions,
    defaultValue: 'default',
  },
  {
    name: 'Font Size',
    key: 'fontSize',
    options: fontSizeOptions,
    defaultValue: 14,
  },
  {
    name: 'Word Wrap',
    key: 'wordWrap',
    options: wordWrapOptions,
    defaultValue: 'on',
  },
]);

const defaultSettings = formItems.value.reduce((settings, item) => ({
  ...settings,
  [item.key]: item.defaultValue,
}), {} as Settings);

/**
 * Page Data
 */
const enable = ref(true);
const settingsForm = ref<Settings | null>(null);

/**
 * Page Methods
 */
// set settings to storage
const setEnable = () => {
  chrome.storage.local.set({
    enable: enable.value,
  });
};
const setSettings = () => {
  chrome.storage.local.set({
    settings: settingsForm.value,
  });
};

// close the settings
const closeSettings = window.close;

/**
 * Page Setup
 */
// get settings from storage
chrome.storage.local.get('enable', (state) => {
  enable.value = state.enable !== false;
});
chrome.storage.local.get('settings', (state) => {
  // assign settings
  settingsForm.value = {
    ...defaultSettings,
    ...state?.settings,
  };
  setSettings();
});
</script>

<style lang="less">
.prettyprint-source__settings {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  .settings__form {
    margin-bottom: -8px;
    &.n-form .n-form-item {
      --n-feedback-height: 16px !important;
    }
  }
}
</style>
