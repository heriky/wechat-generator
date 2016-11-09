/* 微信基本功能 */
const sha1 = require('sha1') ;
const wechat = require('../wechat');
const getRawBody = require('raw-body');
const xml2JSON = require('../utils')['xml2JSON'];
const rules = require('../rules');

module.exports = function(opts){
  return function* (next){
    this.wechat = wechat ; // wechat实例 挂载在ctx上方便调用

    const q = this.query;
    const encrypted = sha1([opts.token, q.timestamp, q.nonce].sort().join(''));

    // GET请求验证
    if(this.method ==='GET'){
      if (encrypted !== q.signature) {
        this.body = 'Error, 账号验证未通过。';
        return false;
      }
      this.body = q.echostr + "";
      return true;
    }

    // POST 请求数据
  if(this.method === 'POST'){
      if (encrypted !== q.signature) {
        this.body = 'Error, 账号验证未通过。'
        return false;
      }

    // 使用raw-body中间件获取提交的文本流, 得到Buffer类型数据
    const bufData = yield getRawBody(this.req, {
      length: this.length,
      limit: '1mb',
      encoding: this.charset
    });
    const msg = yield* xml2JSON(bufData.toString()) ; // 使用yield也可以

    // 将消息挂在上下文中，可用于传递,在中间件中处理。这种全局挂在，然后再中间件中处理的思想非常重要。
    this.recvMsg = msg ;
    console.log('__________接收微信客户端到的消息:______________\n\r', msg);
    console.log('_______________________________________________\n\r');

    // 1. 将收到的消息解析成功之后，将执行权限交给业务逻辑层，业务逻辑层中进行消息类型的判断和定制回复规则。
    // 2. express使用next串联中间件，koa使用yield next调用中间件的传递。
    // 3. 这里的yield后面的是另一个generator函数，即yield function *(){} .
    // 4. 疑问：这里的next是哪里来的？？注意，koa中间件调用的时候自动传入的是next！！！用于执行中间件的传递 yield next.
    // 5. 在一个中间件中调用另一个中间件的方法就是使用call(this, next)这种调用形式
    yield rules.replyRule.call(this, next) ; // 回复规则,内部有yield next,

    // 以上中间件处理之后再this.body上就会存在回复的消息，然后在wechat.reply中回复即可
    wechat.reply.call(this) ; // 在wechat类中进行消息的回复，使用call的目的是将当前上下文传递给wechat。
    }
  }
}
