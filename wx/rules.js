/*定制回复规则和管理菜单的生成*/

const path = require('path');
//var movieApi = require('../service/movie') ;
var BASE_URL = require('../env.config').wechat.hostname ;

// 生成微信菜单
const wechat = require('./wechat') ;
wechat.delMenu().then(rs=>{ // 先删除原有菜单，再创建新的菜单
	return wechat.createMenu(require('./menu'));
}).then(msg=>{
	console.log('创建菜单完成:',msg) ;
}).catch(err=>{
	console.log('创建菜单异常.',err)
})

// 处理事件推送
function handleEvent(msg){
	switch(msg.Event){
		case 'subscribe':
			if(msg.EventKey){
				console.log(`扫描二维码进来的.EventKey:${msg.EventKey} .Ticket:${msg.Ticket}`)
			}
			this.body = {type:'text', content: '你好,欢迎关注ihankang。\n请按照以下提示进行操作:\n1.回复1，测试自动回复。2.点击'+
			'<a href="http://6ecdaf05.tunnel.qydev.com/movie">这里</a>可以进入语音查电影\n3.直接回复语音消息可以进行语音查电影'}
			break;

		case 'unsubscribe':
			this.body = {type:'text',content:''} ;
				console.log('无情取关')
			break;
		case 'SCAN':
			console.log(`关注后扫描二维码. EventKey:${msg.EventKey}. Ticket: ${msg.Ticket}`)
			this.body = {type:'text', content: "扫描了二维码"}
			break;

		case 'LOCATION':
			console.log(`上报地理位置。Latitude:${msg.Latitude}. Longitude:${msg.Longitude}. Precision:${Precision}`)
			this.body = {type: 'text', content: '上报了地理位置.'}
			break;

		case 'CLICK':
			console.log('点击了自定义菜单，发生click事件。EventKye:'+msg.EventKey)
			this.body = {type:'text', content: '点击自定义菜单CLICK'}
			break;

		case 'VIEW':
			console.log('点击自定义菜单，View事件. url为：'+ msg.EventKey)
			this.body = {type: 'text', content:'VIEW事件发生'}
			break;

		case 'scancode_push':
			console.log('扫描二维码事件推送1.')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('二维码类型:'+ msg.ScanCodeInfo.ScanType)
			console.log('二维码结果:'+ msg.ScanCodeInfo.ScanResult)
			this.body = {content: '二维码类型:'+ msg.ScanCodeInfo.ScanType+'二维码结果:'+ msg.ScanCodeInfo.ScanResult}
			break;
		
		case 'scancode_waitmsg':
			console.log('扫描二维码事件推送2.')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('二维码类型:'+ msg.ScanCodeInfo.ScanType)
			console.log('二维码结果:'+ msg.ScanCodeInfo.ScanResult)

			this.body = {content: '二维码类型:'+ msg.ScanCodeInfo.ScanType+'二维码结果:'+ msg.ScanCodeInfo.ScanResult}
			break;
		
		case 'pic_sysphoto':
			// 这类调用相机或者图片的事件推送必须注意
			// 首先会推送一个事件，之后会发送一个或者多个图片类型的消息"msgType: image"

			console.log('弹出系统拍照')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('图片数量:'+ msg.SendPicsInfo.Count)
			console.log('图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList))

			this.body = {content: '图片数量:'+ msg.SendPicsInfo.Count+'图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList)};
			break;
		
		case 'pic_photo_or_album':
			console.log('弹出拍照或者相册')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('图片数量:'+ msg.SendPicsInfo.Count)
			console.log('图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList))

			this.body = {content: '图片数量:'+ msg.SendPicsInfo.Count + '图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList)}
			break;
		
		case 'pic_weixin':
			console.log('弹出相册')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('图片数量:'+ msg.SendPicsInfo.Count)
			console.log('图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList))

			this.body = {content: '图片数量:'+ msg.SendPicsInfo.Count + '图片列表:'+ JSON.stringify(msg.SendPicsInfo.PicList)}
			break;
		
		case 'location_select':
			console.log('地理位置选择')
			console.log('事件类型为:'+ msg.Event)
			console.log('参数值为:'+ msg.EventKey)
			console.log('经度:'+ msg.SendLocationInfo.Location_X)
			console.log('纬度:'+ msg.SendLocationInfo.Location_Y)
			console.log('缩放:'+ msg.SendLocationInfo.Scale)
			console.log('标签:'+ msg.SendLocationInfo.Label)
			console.log('Poiname:'+ msg.SendLocationInfo.Poiname)

			this.body = {content: '经度:'+ msg.SendLocationInfo.Location_X+'纬度:'+ msg.SendLocationInfo.Location_Y+
				'缩放:'+ msg.SendLocationInfo.Scale+'标签:'+ msg.SendLocationInfo.Label+'Poiname:'+ msg.SendLocationInfo.Poiname}
			break;

		default:
			throw Error('Invalid EventType, by hk.')		
	}
}

// 处理文本消息的回复规则
function handleText(msg){
	const recvContent = msg.Content;
	if(recvContent === '1'){  	 // 文本消息
		this.body = {type: 'text', content: '天下第一吃大米'}

	}else if(recvContent == '2'){ // 图文消息
		//array(obj) [{title, description, picUrl, url},{}]
		var content = [{
			title: '发狗粮的季节',
			description: '猝不及防就发狗粮，我兼职哔了狗了',
			picUrl: 'http://img3.cache.netease.com/3g/2015/10/31/201510311401228c35c.jpg',
			url: 'http://baidu.com'
		}]
		this.body = {type: 'news', content: content}

	}else if(recvContent == '3'){ // 临时图片消息
		return this.wechat.uploadMaterial(path.resolve(__dirname, '../2.jpg'), 'image').then(rs=>{
			this.body = {type: 'image', content: rs.media_id};
		}) ;

	}else if(recvContent == '4'){ // 临时视频消息
		return this.wechat.uploadMaterial(path.resolve(__dirname, '../6.mp4'), 'video').then(rs=>{
			// {mediaID, title, description}
			this.body = {type: 'video', content: {
				mediaID: rs.media_id,
				title: '测试视频',
				description: '这仅仅是一个测试视频，用来测试临时素材上传和视频消息回送'
			}}
		})

	}else if(recvContent == '5'){// 永久图片消息
		return this.wechat.uploadMaterial(path.resolve(__dirname, '../2.jpg'), 'image',{}).then(rs=>{ // 第三个参数赋值
			this.body = {type: 'image', content: rs.media_id};
		})
	}else if(recvContent == '6'){ // 永久视频消息
		const title = '永久视频素材的标题';
		const introduction = '这是一个永久视频素材的简介!哈哈哈哈哈';
		return this.wechat
			.uploadMaterial(path.resolve(__dirname, '../6.mp4'), 'video',
				{description: `{"title":"${title}", "introduction":"${introduction}""}`})
			.then(rs=>{
				this.body = {type: 'video', content: {
					mediaID: rs.media_id,
					title: '永久视频',
					description: '这是一个测试永久视频素材上传的程序'
				}}
			})

	}else if(recvContent == '7'){ // 测试fetchMaterial方法
		// 上传一张图片 -> 上传一个永久素材的图文=> 使用media_id 获取该图文 => 发送该图文
		var picUrl ; 
		return this.wechat.uploadMaterial(path.resolve(__dirname, '../2.jpg'), 'image',{}).then(rs=>{
			var picID = rs.media_id;
			picUrl = rs.url;
			const news = {
				articles: [
					{
						title: '没有标题', 
						thumb_media_id: picID, 
						author: 'hk', 
						digest: '居然还要写摘要，好麻烦啊!',
						show_cover_pic: 1,
						content: '内容部分不知道写什么，就先写这么多吧！！', 
						content_source_url: 'http:// hao123.com'
					}
				]
			};
			return news;
		})
		.then(news =>{
			return this.wechat.uploadMaterial('', 'news', news).then(rs=>{
				return rs.media_id ; // 上传图文消息成功后返回图文素材的id
			})
		})
		.then(media_id=>{
			return this.wechat.fetchMaterial(media_id, 'news', {}).then(rs=>{
				console.log(rs)
				var items = rs.news_item ;
				var content = [] ; // 将要被回复的图文数组
				items.forEach((item, index)=>{
					content.push({
						title: item.title,
						description: item.digest,
						picUrl: picUrl,
						url: item.url
					})
				}) ;
				
				this.body = {type: 'news', content: content}
			})
		})
	}else if(recvContent == '8'){ // 测试素材总数
		return this.wechat.countMaterial().then(rs=>{
			console.log(JSON.stringify(rs));
			this.body = {type: 'text', content: '素材总数'} ;
		})
		.catch(err=>{
			console.log(err);
		})
	}else if(recvContent == '9'){// 测试素材列表
		return this.wechat.listMaterial({type: 'news', offset: 0, count: 20}).then(rs=>{
			console.log(rs) ;
			this.body = {type: 'text', content: '获取素材列表'}
		})
		.catch(err=>{
			console.log(err) ;
			throw new Error(err);
		})
	}else if(recvContent == '10'){ // 删除永久素材测试
		this.body = {type: 'text', content: '删除测试'} ;
	}else if(recvContent == '11'){ // 测试标签管理和用户管理
		// 创建标签 => 获取标签 => 为用户打标签 => 按标签获取用户open_id => 通过open_id 获取用户详细信息
		
		// return this.wechat.createTag('第一个分组').then(rs=>{
		// 	console.log('创建新的标签，tagid为:'+ rs.tag.id);
		// 	return this.wechat.tagUsers({openid_list:[msg.FromUserName], tagid: rs.tag.id})
		// })
		return this.wechat.getTags()
		.then((rs)=>{
			console.log('标签列表为:', rs)
			// 按openid获取用户具体信息
			return this.wechat.fetchUserInfo(msg.FromUserName).then(rs=>{

				this.body = {type:'text', content: JSON.stringify(rs)}
			})
		})
		.catch(err=>{
			console.log('测试11发生错误:'+ err);
		})
	}else if(recvContent == '12'){ // 测试用户列表
		return this.wechat.getUserList().then(rs=>{
			this.body = {type: 'text', content: JSON.stringify(rs)};
		})
	}else if(recvContent == '13'){ // 测试消息群发
		const tagid = 100;
		const type = 'mpnews';
		const mediaID = 'ypkVD77Q4h1m4PpKF-q0Rfq_1pBsvfw3OlijyC7WfK8' ; // 测试的素材

		return this.wechat.sendMsgByTag(tagid, type, mediaID).then(rs=>{
			console.log('消息发送成功，返回值如下:', JSON.stringify(rs)) ;
			this.body = {type: 'text', content: '群发消息成功'}
		})
	}else if(recvContent == '14'){
		
	}else if(recvContent == '15'){
		
	}else if(recvContent == '16'){
		
	}else if(recvContent == '17'){

	}
	else{
		this.body = {type: 'text', content: '听不懂你说什么'}
	}

	return [] ; // 为了兼容素材上传时通过yield来调用该函数
}


// 处理语音搜电影
// function* handleVoice (msg){
// 	 var key = msg.Recognition ; // 要去除最后面的句号！！！
// 	 key =  key.slice(0,-1); // 去除最后的标点符号。
// 	 console.log('识别的语音为:', key);

// 	 if (key.trim() ==='') {
// 	 	this.body = {type: 'text', content: '未识别的语音，请您重新输入语音。'}; return ;
// 	 }
	
// 	var movies	= yield movieApi.search(key) ;
// 	if(movies.length == 0 ){this.body = {type: 'text', content: '未搜索到任何信息，请尽量发送清楚的语音'}; return ;};

// 	// 生成content实体
// 	var len = movies.length >5 ? 5 : movies.length ; // 超过5条，则只显示前五条
// 	var content = [] ;
// 	for(var i=0; i<len; i++){ // 数据库数据 || 豆瓣数据
// 		var movie = movies[i] ;
// 		content.push({
// 			title: movie.title,
// 			description: movie.director || '佚名',
// 			picUrl: movie.poster ,
// 			url: BASE_URL+'/wx/movie/'+movie._id
// 		})
// 	}
//  this.body = {type: 'news', content: content} ;
// }

exports.replyRule = function* (next){
	const recvMsg = this.recvMsg ;

	// 整体划分为"事件推送"和"普通消息"， 事件推送内通过Event区分不同事件。
	switch(recvMsg.MsgType){
		case 'event':
			handleEvent.call(this, recvMsg)
			break;
		case 'text':
			yield handleText.call(this, recvMsg); //yield处理耗时操作。
			break;
		case 'image':
			this.body = {content:'收到的图片url为:' + recvMsg.PicUrl}
			break;
		case 'voice':
			//yield handleVoice.call(this, recvMsg) ;
			break;
		case 'video':

			break;
		case 'music':
			
			break;
		case 'news':

			break;
		default: 
			throw new Error('Invalid msgType, by hk.')
	}

	yield next; // 千万不能忘记这个。
}