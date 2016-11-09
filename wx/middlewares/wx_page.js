/* 微信网页开发*/
const wechat = require('../wechat');
const utils = require('../utils') ;
//const movieApi = require('../../service/movie') ;

// 网页语音识别
exports.guess = function(opts){ // 传入配置项，用于验证api_ticket 和accesstoken
  return function* (next){
    //获取accesstoken => 获取ticket => 签名=> 渲染页面
    const acObj = yield wechat.getAccessToken() ;
    const ticketObj = yield wechat.getTicket(acObj.access_token) ;
    const ticket = ticketObj.ticket;
    const signData = createSignData(opts.appID, ticket, this.href);

    // this.originalUrl打印出/movie ,this.href打印出http://5eed222f.tunnel.qydev.com/movie
    // 所以用this.href
    //console.log('测试this.href:', this.href) ;
    //console.log('url'+this.url, 'originalUrl:'+this.originalUrl, 'origin:'+ this.origin, 'href:'+this.href, 'path:'+this.path)
    //console.log('签名数据对象:', signData);

    var arrConvert = '[';
    signData.jsApiList.forEach((item)=>{arrConvert += '"'+item+'",'}) ;
    arrConvert+= ']' ;
    signData.jsApiList = arrConvert ;
    yield this.render('/wx/guess',{data:signData})
  }
}

// 电影详情
// exports.detail = function* (next){
//   var id = this.params.id ;
//   var movie = yield movieApi.searchById(id) ;
//   yield this.render('/wx/movie_detail', {movie: movie})
// }



// 用于js_sdk 的签名认证
function createSignData(appId, ticket, url){
  const timestamp = parseInt((+new Date() / 1000), 10);
  const nonceStr = Math.random().toString(36).substr(2, 16);
  const signature = utils.ticketSign(nonceStr, ticket, timestamp, url);
  const jsApiList = [
    'startRecord',
    'stopRecord',
    'onVoiceRecordEnd',
    'translateVoice'
  ];

  return {appId, timestamp, nonceStr, signature, jsApiList};
}

