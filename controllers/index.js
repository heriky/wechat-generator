exports.test = function* (next){
  yield this.render('pages/index', {title: '测试标题'})
}