/**
 * 网站字体相关配置
 * 
 */
module.exports = {
  // START ************网站字体*****************
  FONT_STYLE: process.env.NEXT_PUBLIC_FONT_STYLE || 'font-serif font-normal',

  FONT_URL: [
    'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css?family=Bitter&display=swap'
  ],

  FONT_SANS: [
    '"PingFang SC"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Segoe UI"',
    '"Noto Sans SC"',
    'HarmonyOS_Regular',
    '"Helvetica Neue"',
    'Helvetica',
    '"Source Han Sans SC"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"'
  ],

  FONT_SERIF: [
    '"Noto Serif SC"',
    'Bitter',
    'SimSun',
    '"Times New Roman"',
    'Times',
    'serif',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Apple Color Emoji"'
  ],

  FONT_AWESOME:
    process.env.NEXT_PUBLIC_FONT_AWESOME_PATH ||
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',

  // 关键修复：添加逗号
  GLOBAL_CSS: `
    :root {
      --article-font-size: 1.5rem;
    }
    .notion {
      font-size: var(--article-font-size) !important;
      font-family: "Noto Serif SC", serif;
    }
  `
  // END ************网站字体*****************
}
