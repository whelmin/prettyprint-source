import './assets/content-scripts.less';

/**
 * The type of source info to pass to viewer
 */
export interface SourceInfo {
  filename: string;
  contentType: string;
  text: string;
}

/**
 * Proxy sendMessage to background
 */
const background = new Proxy({} as Record<string, () => Promise<any>>, {
  get(target, prop) {
    return () => new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: prop }, (response) => {
        resolve(response);
      });
    });
  },
});

/**
 * constant
 */
const IFRAME_ID = 'prettyprint-source__iframe';
const LOADING_ID = 'prettyprint-source__loading';
const MODE_ID = 'prettyprint-source__mode';
const MODE_CONTAINER_ID = 'prettyprint-source__mode__container';
const MODE_OPTIONS = [
  {
    label: 'Raw',
    value: 'raw',
    defaultActive: false,
  },
  {
    label: 'Formatted',
    value: 'formatted',
    defaultActive: true,
  },
];

/**
 * variable
 */
let preElement: HTMLPreElement | null;
let iframeElement: HTMLIFrameElement | null;
let modeElement: HTMLDivElement | null;
let loadingElement: HTMLDivElement | null;
let pluginSettingsSwitch: boolean | null; // default is true, in settings will change

/**
 * Get the only <pre> in the source
 */
function getPre() {
  if (
    document.body
    && document.body.getElementsByTagName('pre').length === 1
    && document.body.childNodes.length === 1
  ) {
    return document.body.getElementsByTagName('pre')[0];
  }
  return null;
}

/**
 * create an iframe for viewer
 */
function createViewer() {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('id', IFRAME_ID);
  iframe.setAttribute('src', chrome.runtime.getURL('/index.html'));
  iframe.setAttribute(
    'style',
    'position: absolute; top: 0; bottom: 0; left: 0;right: 0; width: 100vw; height: 100vh; border: none;',
  );
  document.body.appendChild(iframe);
  iframeElement = document.getElementById(IFRAME_ID) as HTMLIFrameElement;
}

/**
 * remove all active
*/
function removeAllClass(classname: string) {
  const items = document.getElementsByClassName('item');
  [].forEach.call(items, (el: HTMLDivElement) => {
    el.classList.remove(classname);
  });
}

/**
 * create switch mode (Raw / Formatted)
 */
function createMode() {
  const mode = document.createElement('div');
  const container = document.createElement('div');
  mode.setAttribute('id', MODE_ID);
  container.setAttribute('id', MODE_CONTAINER_ID);
  mode.appendChild(container);
  MODE_OPTIONS.forEach((i) => {
    const item = document.createElement('div');
    item.setAttribute('class', i.defaultActive ? 'item active' : 'item');
    item.setAttribute('data-tab', i.value);
    const content = document.createTextNode(i.label);
    item.appendChild(content);
    container.appendChild(item);
  });
  document.body.appendChild(mode);
  modeElement = document.getElementById(MODE_ID) as HTMLDivElement;
}

/**
 * create loading
 */
function createLoading() {
  const loading = document.createElement('div');
  const img = document.createElement('img');
  const loadingUrl = new URL('./assets/Rolling-1s.svg', import.meta.url).href;
  img.setAttribute('src', loadingUrl);
  loading.append(img);
  loading.setAttribute('id', LOADING_ID);
  loading.setAttribute('display', 'block');
  document.body.appendChild(loading);
  loadingElement = document.getElementById(LOADING_ID) as HTMLDivElement;
}

/**
 * Init viewer iframe
 */
function initViewer(sourceInfo: SourceInfo) {
  window.addEventListener('message', (message) => {
    const { origin } = new URL(chrome.runtime.getURL(''));
    if (message.origin !== origin) {
      return;
    }
    if (message.data === 'loaded') {
      message.source?.postMessage(
        {
          name: 'init',
          data: sourceInfo,
        },
        {
          targetOrigin: origin,
        },
      );
    }
  });
}

/**
 * Get Source Info
 */
async function getSourceInfo(pre: HTMLPreElement): Promise<SourceInfo> {
  const url = new URL(window.location.href);
  const filename = url.pathname.split('/').pop() || '';
  const contentType = await background.getContentType();
  return {
    filename,
    contentType,
    text: pre.textContent || '',
  };
}

/**
 * launch prettyprint
 */
async function launch() {
  preElement = getPre();
  if (!preElement) return;
  preElement.style.display = 'none';
  createLoading();
  createViewer();
  createMode();
  const sourceInfo = await getSourceInfo(preElement);
  initViewer(sourceInfo);
}

/**
 * enable or disable prettyprint
 */
async function enable(status: boolean) {
  if (loadingElement) {
    loadingElement.style.display = 'block';
  }
  if (status) {
    // enable
    if (iframeElement) {
      if (preElement) preElement.style.display = 'none';
      if (modeElement) modeElement.style.display = 'block';
      iframeElement.style.display = 'block';
    } else {
      // init
      await launch();
    }
  } else {
    // disable
    if (preElement) preElement.style.display = 'block';
    if (iframeElement) iframeElement.style.display = 'none';
    if (modeElement && !pluginSettingsSwitch) modeElement.style.display = 'none';
  }
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Init mode
 */
function initMode() {
  document.getElementById(MODE_CONTAINER_ID)?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target?.className.includes('item')) {
      removeAllClass('active');
      target?.classList.add('active');
      switch (target?.dataset.tab) {
        case 'raw':
          enable(false);
          break;
        case 'formatted':
          enable(true);
          break;
        default:
          break;
      }
    }
  });
}

chrome.storage.local.get('enable', async (state) => {
  if (state.enable !== false) {
    pluginSettingsSwitch = true;
    enable(true);
    initMode();
  }
});

/**
 * listen to chrome.storage
 */
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local') {
    const { origin } = new URL(chrome.runtime.getURL(''));
    const postMessage = (type: 'update') => {
      iframeElement?.contentWindow?.postMessage(
        { name: type },
        {
          targetOrigin: origin,
        },
      );
    };
    const isSettingsChanged = changes.settings?.newValue;
    const isEnable = changes.enable?.newValue;
    if (isSettingsChanged) {
      postMessage('update');
    }
    if (isEnable) {
      pluginSettingsSwitch = true;
      enable(true);
    }
    if (changes.enable && !isEnable) {
      pluginSettingsSwitch = false;
      enable(false);
    }
  }
});

export {};
