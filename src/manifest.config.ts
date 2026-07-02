import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Prompt Library Injector',
  version: '1.0.0',
  description:
    'Inject categorized Markdown prompts from your GitHub repository into any web AI interface with a single click.',

  permissions: ['storage', 'scripting', 'activeTab', 'tabs'],
  host_permissions: ['https://api.github.com/*', '<all_urls>'],

  icons: {
    '16':  'icons/icon16.png',
    '48':  'icons/icon48.png',
    '128': 'icons/icon128.png',
  },

  action: {
    default_popup: 'index.html',
    default_icon: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
    },
    default_title: 'Prompt Library Injector',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],

  web_accessible_resources: [
    {
      resources: ['icons/*', 'assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
