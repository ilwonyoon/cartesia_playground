import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Cartesia Take-Home',
  description: 'Design notes for the Cartesia Product Design Lead exercise',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  vite: {
    server: {
      host: '0.0.0.0',
      port: 5181,
      strictPort: true,
    },
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Notes', link: '/notes/cartesia-takehome' },
    ],

    sidebar: {
      '/': [
        {
          text: 'Cartesia',
          items: [
            { text: 'Take-home brief', link: '/notes/cartesia-takehome' },
            { text: 'Design system', link: '/notes/cartesia-design-system' },
          ],
        },
        {
          text: 'Guides',
          items: [
            { text: 'Getting started', link: '/guides/' },
            { text: 'Markdown syntax', link: '/guides/markdown-syntax' },
          ],
        },
      ],
    },

    search: { provider: 'local' },
    outline: { label: 'On this page', level: [2, 3] },
    docFooter: { prev: 'Previous', next: 'Next' },

    lastUpdatedText: 'Last updated',
    darkModeSwitchLabel: 'Dark mode',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Back to top',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ilwonyoon/cartesia_playground' },
    ],
  },
})
