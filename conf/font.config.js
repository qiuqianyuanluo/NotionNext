/**
 * 网站字体相关配置
 * 
 */
module.exports = {
  // START ************网站字体*****************
  // 使用衬线字体并调整字体粗细
  FONT_STYLE: process.env.NEXT_PUBLIC_FONT_STYLE || 'font-serif font-normal', // 改为衬线+正常粗细

  // 字体资源（重点修改）
  FONT_URL: [
    'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap', // 调整字体粗细范围
    'https://fonts.googleapis.com/css?family=Bitter&display=swap'
  ],

  // 无衬线字体配置（保持默认）
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

  // 衬线字体配置（重点修改）
  FONT_SERIF: [
    '"Noto Serif SC"', // 将目标字体提到第一位
    'Bitter',
    'SimSun',
    '"Times New Roman"',
    'Times',
    'serif',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Apple Color Emoji"'
  ],

  // 字体图标配置
  FONT_AWESOME:
    process.env.NEXT_PUBLIC_FONT_AWESOME_PATH ||
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',

  // 全局字体样式（新增关键配置）
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


