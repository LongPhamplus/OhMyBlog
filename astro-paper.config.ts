import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://ohmyblog-plogplus.pages.dev/",
    title: "OhMyBlog",
    description: "Blog, write-ups and research on web security, Active Directory and more.",
    author: "LongPham",
    profile: "https://ohmyblog-plogplus.pages.dev/about/",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Ho_Chi_Minh",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/LongPhamplus/OhMyBlog/edit/main/",
    },
    search: "pagefind",
    toc: true,
  },
  socials: [
    { name: "github",   url: "https://github.com/LongPhamplus" },
    { name: "mail",     url: "mailto:ploganonymous@gmail.com" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});