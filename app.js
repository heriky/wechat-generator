const http = require('http');
const koa = require('koa');
const app = koa() ;
const envConf = require('./env.config');

const logger = require('koa-logger');
const mongoose = require('mongoose');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static') ;
const favicon = require('koa-favicon');
const views = require('koa-views');

const router = require('./routes');

/* 1.基本配置 */
app.use(logger());
// 数据库
mongoose.Promise = global.Promise;
mongoose.connect(envConf.mongo.dbUri) ;
// session
app.keys = ['The secret string'] ;
app.use(session(app),{});
// bodyparser
app.use(bodyParser());
// 静态资源
app.use(serve(envConf.staticRes))
app.use(favicon(envConf.staticRes+'/favicon.ico'))
// 模板引擎
app.use(views(__dirname+'/views', {extension: 'jade'}))

/* 2. 设置入口路由 */
app.use(router.routes()).use(router.allowedMethods());

/*3. 错误处理*/
app.on('error', (err, ctx)=>{
  console.error("服务器端错误", err);
})

/* 4. 设置监听*/
http
.createServer(app.callback())
.listen(envConf.port || process.env.PORT || 3000);

