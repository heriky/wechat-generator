### wechat-generator
> 基于koa的web项目，整合了微信相关接口预处理，可同时为web和wechat服务。

0. 使用方法

>npm install && npm start
> 微信网页开发，访问localhost:3000/wx/guess 示例

### 1. 微信相关目录
```
- wx
  -config           记录配置
    accessToken     缓存accessToken
    jsApiTicket     缓存jsApiTicket
  -middleware       专门处理微信业务的中间件(控制器)
    wx_basic.js     微信基础业务（消息）
    wx_page.js      微信网页开发
  menu.js           微信界面菜单配置
  rules.js          微信消息回复规则
  tpl.js            微信消息回复模板
  utils.js          工具类
  wechat.js         微信业务封装类（处理accesstoken，jsAPITicket和replay逻辑）

-views
  -wx              微信网页模板
    guess.jade     网页开发示例
```

### 2. 相关

- [Bee]() 私人订制的手脚架工具
- koa-wechat-middleware 在koa框架下的微信中间件
- jade => dot.js
