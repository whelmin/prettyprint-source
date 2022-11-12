/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-airbnb-with-typescript',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-param-reassign': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'vue/multi-word-component-names': 'off',
  },
};
