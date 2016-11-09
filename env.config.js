const path = require('path');
module.exports = {
  mongo:{
    dbUri: 'mongodb://127.0.0.1:27017/test'
  },
  wechat: {
    appID: 'wx5c4c290c2c7879b2',
    appsecret: 'b9ea8ab439695142453ec61a1156238e',
    token: 'ihankang',
    tokenPath: path.resolve(__dirname, './wx/config/accessToken'),
    jsApiTicketPath: path.resolve(__dirname, './wx/config/jsApiTicket'),
    hostname: 'qydev.com'
  },
  staticRes: path.resolve(__dirname, './public'),
  port: 3000
}