const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // 如果没有依赖需要额外转译，就用空数组
  transpileDependencies: [],

  // 关闭保存时的 ESLint 检查
  lintOnSave: false,

  devServer: {
    host: '0.0.0.0',
    port: 3000,

    // 允许所有 Host header（webpack-dev-server v4）
    allowedHosts: 'all',

    // 如果你还在用 v3，则可以开启下面这一行：
    // disableHostCheck: true,
  }
})
