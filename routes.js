const Router = require('koa-router');
const rootRouter = new Router() ;
const wxRouter = new Router() ; // 子路由

const wxConfig = require('./env.config')['wechat'] ;
const wxC = require('./wx/middlewares/wx_basic')(wxConfig) ;
const wxPageC = require('./wx/middlewares/wx_page');

const indexC = require('./controllers/index');


/*普通路由*/
rootRouter.get('/', indexC.test) ;

/*微信路由,子路由*/
wxRouter
.get('/', wxC)
.post('/', wxC)
.get('/guess', wxPageC.guess(wxConfig))

rootRouter.use('/wx', wxRouter.routes(), wxRouter.allowedMethods()) ; // 子路由整合至根路由

module.exports = rootRouter;