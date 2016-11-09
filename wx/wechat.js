/**
 * 微信功能类,将微信提供的api都封装在这个类中
 *
 * [用于对微信一些参数进行初始化、更新或者预处理]
 * @param {[type]} opts [需要传入配置参数,必须包含的字段有:
 * {
 * 		appID,
 * 		appsecret,
 * 		token,
 * 		tokenPath,  // 保存accessToken的文件路径
 * 		tokenUrl // 获取新的accesstoken所使用的请求tokenUrl
 * }
 */

const fs = require('fs');
const request = require('superagent');
const renderMsg = require('./utils')['renderMsg'];
const BASE_URL = 'https://api.weixin.qq.com';
const wConfig = require('../env.config')['wechat'] ;


function Wechat(opts){
	this.appID = opts.appID ;
	this.appsecret = opts.appsecret;
	this.token = opts.token;
	this.tokenPath = opts.tokenPath;
	this.jsApiTicketPath = opts.jsApiTicketPath ;
	console.log('Wechat实例化一次'); // 暴露出单例的形式

	// 请求accesstoken的url
	this.tokenUrl = BASE_URL+`/cgi-bin/token?grant_type=client_credential&appid=${opts.appID}&secret=${opts.appsecret}`; 
	// 请求jsapi_ticket的url
	this.ticketUrl = BASE_URL+'/cgi-bin/ticket/getticket?type=jsapi&access_token=' ; // access_token
	//Wechat.prototype.getAccessToken.call(this)
}

Wechat.prototype = {

	/***************消息回复*****************/
	reply: function(){
		var rawReply = this.body ; // 根据业务逻辑层的规则产生不同的回复体，格式为{type:消息体类型，content: 消息体具体内容}
		var recvMsg = this.recvMsg; // 用于发来的消息体
		const reply = renderMsg(rawReply, recvMsg);

		//console.log('消息回复如下:', reply)

		this.type = 'application/xml';
		this.status = 200 ;
		this.body = reply ;
		return;
	},
	/**************** 全局管理 accesstoken***********************/
	getAccessToken: function(){  // 读取文件-> 是否过期-> 否(不操作)，是-> 发起请求
		return this.readExtraFile(this.tokenPath)
			.then(content=>{ // 读取的是字符串
				try{
					const obj = JSON.parse(content);
					if(!this.isValidAccessToken(obj)){   // 有效则直接返回; 无效则重新获取返回，并保存在文件中
						console.log('无效的accesstoken,开始获取新的accesstoken');
						return this.updateAcessToken()
							.then(newToken=>{
								// 先返回再保存
								this.saveExtraFile(newToken, this.tokenPath).then().catch(err=>{console.log('写入文件发生错误',err); throw err;});
								return JSON.parse(newToken);
							});
					}else{
						console.log('有效的accesstoken')
						return JSON.parse(content);
					}
				}catch(err){  // 异常分为两类:1.文件不粗拿在 2.文件中字符串时非法的JSON字符串。
					console.log('发生错误', err) ;
					return this.updateAcessToken().then(newToken=>{
						this.saveExtraFile(newToken, this.tokenPath).then().catch(err=>{console.log('写入文件发生错误',err); throw err;});
						return JSON.parse(newToken);
					});
				}
			})
			.catch(err=>{
				console.log(err) ;
				throw err;
			});
	}
	,
	// 按路径读取数据，对access_token和jsapi_ticket是通用的
	readExtraFile: function(path){
		return new Promise((resolve, reject)=>{
			fs.readFile(path, (err, data)=>{
				if (err) {reject(err)}
				else{
					resolve(data);
				}
			})
		})
	},

	// 按路径存储数据，对access_token和jsapi_ticket是通用的
	saveExtraFile: function(data, path){
		return new Promise((resolve, reject)=>{
			fs.writeFile(path, data, err=>{
				if (err) {reject(err)}
				else{
					resolve(true);
				}
			})
		})
	},

	updateAcessToken: function(){
		// 发送新的请求, 获取新的json数据{access_token:'', expires_in:''}
		return new Promise((resolve, reject)=>{
			request
        .get(this.tokenUrl)
        .timeout(10000)
        .end((err, res) => {
					if (err) { reject(err) }
					else{
						const data = JSON.parse(res.text) ; // data的结构为{access_token:', expires_in:''}

						// 成功请求后就加入自定义的字段expires来标识过期时间，这里设定提前20s过期
						data['expires'] = (+new Date()) + (data['expires_in'] - 20)*1000; // expires_in单位是秒，时间戳是毫秒
						console.log('新的accesstoken为:'+res.text)
						resolve(JSON.stringify(data))
					}
        })
		})
	},

	isValidAccessToken: function(data){
		if (data==null || data['access_token'] == null || data['expires_in'] == null || data['expires'] == null) {
			return false;
		}
		const now = +new Date();
		if (now >= data['expires']) {
			return false;
		}
		return true;
	},


		/************************全局管理jsapi_ticket****************************/

	// 获取jsapi_ticket
	getTicket: function(accessToken){
	// 读取文件-> 是否过期,  否 返回有效值 ，是-> 发起请求-> 存储-> 返回有效值
	// 先获取有效的access_token ，才能获取有效的ticket, 这里使用外部传入
		return this.readExtraFile(this.jsApiTicketPath)
			.then(content=>{ // 读取的是字符串
				try{
					const obj = JSON.parse(content);
					if(!this.isValidTicket(obj)){   // 有效则直接返回; 无效则重新获取返回，并保存在文件中
						console.log('无效的jsapi_ticket,开始获取新的jsapi_ticket');
						return this.updateTicket(accessToken)
							.then(newTicket=>{
								// 先返回再保存
								this.saveExtraFile(newTicket, this.jsApiTicketPath).then().catch(err=>{console.log('写入文件发生错误',err); throw err;});
								return JSON.parse(newTicket);
							});
					}else{
						console.log('有效的jsapi_ticket')
						return JSON.parse(content);
					}
				}catch(err){  // 异常分为两类:1.文件不粗拿在 2.文件中字符串时非法的JSON字符串。
					console.log('发生错误', err) ;
					return this.updateTicket(accessToken).then(newTicket=>{
						this.saveExtraFile(newTicket, this.jsApiTicketPath).then().catch(err=>{console.log('写入文件发生错误',err); throw err;});
						return JSON.parse(newTicket);
					});
				}
			})
			.catch(err=>{
				console.log(err) ;
				throw err;
			});
	}
	,

	// 更新，重新获取ticket。 调用的时候需要传入accesstoken
	updateTicket: function(accessToken){
		// 发送新的请求, 获取新的json数据{errcode:0, errmsg:'ok',ticket:'', expires_in:''}
		return new Promise((resolve, reject)=>{
			request
        .get(this.ticketUrl+accessToken)
        .timeout(10000)
        .end((err, res) => {
					if (err) { reject(err) }
					else{
						const data = JSON.parse(res.text) ; // data的结构为{access_token:', expires_in:''}

						// 成功请求后就加入自定义的字段expires来标识过期时间，这里设定提前20s过期
						data['expires'] = (+new Date()) + (data['expires_in'] - 20)*1000; // expires_in单位是秒，时间戳是毫秒
						console.log('新的jsapi_ticket为:'+res.text)
						resolve(JSON.stringify(data)) // 传递出去的是字符串
					}
        })
		})
	}
	,
	// 验证ticket的有效性, 主要是时效性
	isValidTicket: function(data){
		if (data==null || data['ticket'] == null || data['expires_in'] == null || data['expires'] == null) {
			return false;
		}
		const now = +new Date();
		if (now >= data['expires']) {
			return false;
		}
		return true;
	}
	,
	/*****************************开始管理素材*****************************/

	// 处理临时素材和永久素材的上传。 permanent区分是临时素材还是永久素材,如果是永久素材，就传入对应的数据结构
	// 如果是临时素材，permanent不需要传递任何参数
	//
	// 临时素材（临时素材只支持image, voice , video ,thumb） -> {media}
	// 永久图文素材 -> permanent -> {title, thumb_media_id, author, digest, show_cover_pic, content, content_source_url}
	// 永久其他素材 -> permanent -> {media, }
	// 永久视频素材 -> permanent -> {media , description}
	uploadMaterial:function(fpath, type, permanent){
		return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var form = {media: fpath} ;
				var uploadUrl = `${BASE_URL}/cgi-bin/media/upload?access_token=${accessToken}&type=${type}` ; //默认为临时素材地址

				Object.assign(form, permanent); // 除了永久图文的上传，其他类型的素材上传都有media这个字段的.

				if (permanent) {
					console.log('开始上传永久素材,,每次请求都上传一次，这样不太好吧！！')
					if(type == 'news'){ // 新增图文素材
						uploadUrl = 'https://api.weixin.qq.com/cgi-bin/material/add_news?access_token='+accessToken ;
						form = permanent ; // 图文的上传不需要media字段
					}else if(type == 'innerPic'){ // 上传图文内容内部的图片
						uploadUrl = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token='+accessToken ;

					}else{ // 其他永久素材
						uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`
					}
				}else{
					console.log('开始上传临时素材,每次请求都上传一次，这样不太好吧！！')
				}
				// 开始上传。
				return new Promise((resolve, reject)=>{
					//永久图文素材的上传是使用表单字段的提交，其他所有类型是使用multipart/form-data类型
					(
					type === 'news' ?
					request.post(uploadUrl).type('json').send(form) :
					(
					//非图文素材的上传,如果上传字段定义了description表明要上传的是一个永久视频素材,否则只附加media一个字段
					form.description == null ?
					request.post(uploadUrl).attach('media', form.media):
					request.post(uploadUrl).attach('media', form.media).field('description', form.description)
					)
					)
	        .timeout(10000)
	        .end((err, res) => {
	        	if (err) { console.log('上传时素材时,请求发生错误.'); reject(err)};

						const rs = JSON.parse(res.text);
						if (rs.errcode&& rs.errcode !== 0) {
							console.log(`上传临时素材发生错误，响应码:${rs.errcode} 响应消息:${rs.errmsg}`) ;
							reject(rs.errmsg) ;
						}else{
							resolve(rs) //上传不同种类的素材，rs对象的结构也会变换，可能有media_id 也可能有url
						}
	        })
				})
			})
	},

	fetchMaterial: function(mediaID, type,permanent){ // 标示获取的是临时素材还是永久素材
			return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var fetchUrl = "";
				if (permanent) {
					// 永久素材的获取是POST方式调用
					// media_id 是通过post请求体发送的。
					fetchUrl = `https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=${accessToken}` ;

				}else{
					//临时素材时GET方式调用
					fetchUrl = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaID}` ;
					fetchUrl = (type === 'video' ? fetchUrl.replace('https', 'http') : fetchUrl); // 视频类型只能使用http协议
				}

				// 临时素材获取的是直接内容, 所以必要的时候再发送请求
				// 永久素材下:
				// 		获取视频素材得到{title,description, dowload_url}
				// 		获取图文素材得到{news_item:[]}
				// 		其他素材直接会被下载, 所以必要的时候发送请求
				// 总之, 非永久图文和视频素材，直接返回url即可，否则需要发送一次请求.

				return new Promise((resolve, reject)=>{
					(permanent == null ?
						request.get(fetchUrl) :
						request.post(fetchUrl).type('json').send({'media_id': mediaID})
					).timeout(10000)
					.end((err, res)=>{
						if (err) { console.log('发起获取素材的请求异常'); reject(err);}

						const rs = JSON.parse(res.text);
						if (rs.errcode && rs.errcode !=0) {
							console.log(`获取素材发生错误，响应码:${rs.errcode} 响应消息:${rs.errmsg}`) ;
							reject(rs.errmsg) ;
						}else{
							resolve(rs); // 对象结构根据type的不同而多种多样
						}
					})
				})
			})
	},

	removeMaterial: function(mediaID, type){ // 移除永久素材,临时素材回自动失效
		return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var delUrl = `https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=${accessToken}`;
				
				return new Promise((resolve, reject)=>{
					request
						.post(delUrl)
						.type('json')
						.send({'media_id': mediaID})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {console.log('在发送删除素材请求时发生错误:', err); reject (err);}

							const rs = JSON.parse(res.text);
							if (rs.errcode &&rs.errcode != 0 ) {
								console.log('删除永久素材异常') ;
								reject(errmsg)
							}else{
								resolve(rs);
							}
						})
				})
			})
	},

	updateMaterial: function(mat){ // 只支持修改永久图文素材,type必须是news
		return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var updateUrl = `https://api.weixin.qq.com/cgi-bin/material/update_news?access_token=${accessToken}` ;
				
				return new Promise((resolve, reject)=>{
					request
						.post(updateUrl)		
						.type('json')
						.send(mat)
						.timeout(10000)
						.end((err, res)=>{
							if (err) { reject(err)} ;
							const rs = JSON.parse(res.text);
							if (rs.errcode &&rs.errcode != 0 ) {
								console.log('更新永久素材异常') ;
								reject(rs.errmsg);
							}else{
								resolve(rs);
							}
						})
				})
			})
	}
	,
	countMaterial: function(){
			return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var countUrl = `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${accessToken}`;
				
				return new Promise((resolve, reject)=>{
					request
						.get(countUrl)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject('在发送获取素材总数的请求时发生错误:'+err);}

							const rs = JSON.parse(res.text);
							if (rs.errcode &&rs.errcode != 0 ) {
								reject('获取素材总数发生错误，响应码为:'+rs.errcode +',响应消息为'+ rs.errmsg);
							}else{
								resolve(rs);
							}
						})
				});

			})
	},

	listMaterial: function(opts){
		return this.getAccessToken()
			.then((obj)=>{
				const accessToken = obj.access_token ;
				var listUrl = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;
				
				var form = Object.assign({type:'news', offset: 0, count: 1},opts); // 默认参数为news, 0, 1

				return new Promise((resolve, reject)=>{
					request
						.post(listUrl)
						.type('json')
						.send(form)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject('在发送获取素材列表的请求时发生错误:'+err);}

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0 ) {
								reject('获取素材列表异常,响应码为: '+rs.errcode+',响应消息为:'+rs.errmsg);
							}else{
								resolve(rs);
							}
						})
				})
			})
	},


 /*********************标签管理*************************/
	
	createTag: function(tagName){
		return this.getAccessToken()
			.then((obj)=>{
				
				var cTagUrl = `https://api.weixin.qq.com/cgi-bin/tags/create?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(cTagUrl)
						.type('json')
						.send({tag: {name: tagName||'默认标签'}})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{ tag:{id, name}}
						})

				})

			})
	},

	// 获取所有标签
	getTags: function(){
		
		return this.getAccessToken()
			.then((obj)=>{
				
				var rTagUrl = `https://api.weixin.qq.com/cgi-bin/tags/get?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.get(rTagUrl)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{tags:[{id, name, count},{id, name, count}]}
						})
				})
			})
	},

	upldateTag: function(tag){ // 传入的tag结构为{id, name}
		return this.getAccessToken()
			.then((obj)=>{
				
				var uTagUrl = `https://api.weixin.qq.com/cgi-bin/tags/update?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(uTagUrl)
						.type('json')
						.send({tag: tag})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode:0]}
						})
				})
			})
	},

	removeTag: function(tag){ // tag结构为{id}
		return this.getAccessToken()
			.then((obj)=>{
				
				var dTagUrl = `https://api.weixin.qq.com/cgi-bin/tags/delete?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(dTagUrl)
						.type('json')
						.send({tag: tag})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode:0]}
						})
				})
			})
	},
	// 获取该标签下的粉丝列表
	fetchUsersByTag: function(tag){ //tag 结构为 {tagid, next_openid}
		return this.getAccessToken()
			.then((obj)=>{
				
				var fetchUsersUrl = `https://api.weixin.qq.com/cgi-bin/user/tag/get?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(fetchUrl)
						.type('json')
						.send(tag)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{count, data:{openid:[],next_openid}}
						})
				})
			})
	},
	
	/*********************用户管理************************/

	// 批量为用户打标签
	tagUsers: function(data){ // data结构为{openid_list:[], tagid}
		return this.getAccessToken()
			.then((obj)=>{
				
				var tagUsersUrl = `https://api.weixin.qq.com/cgi-bin/tags/members/batchtagging?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(tagUsersUrl)
						.type('json')
						.send(data)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode: 0}
						})
				})
			})
	},

	//批量为用户取消标签
	untagUsers: function(data){
		return this.getAccessToken()
			.then((obj)=>{
				
				var untagUsersUrl = `https://api.weixin.qq.com/cgi-bin/tags/members/batchuntagging?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(untagUsersUrl)
						.type('json')
						.send(data)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode: 0}
						})
				})
			})
	},
	//获取用户身上的标签列表
	getTagByUser: function(openid){
		return this.getAccessToken()
			.then((obj)=>{
				
				var untagUsersUrl = `https://api.weixin.qq.com/cgi-bin/tags/getidlist?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(untagUsersUrl)
						.type('json')
						.send({openid: openid})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{taglist: []}
						})
				})
			})
	},

	// 设置用户备注名
	remarkUser: function(data){ // data 结构为{openid,remark}
		return this.getAccessToken()
			.then((obj)=>{
				
				var remarkUsersUrl = `https://api.weixin.qq.com/cgi-bin/user/info/updateremark?access_token=${obj.access_token}`;

				return new Promise((resolve, reject)=>{
					request
						.post(remarkUsersUrl)
						.type('json')
						.send(data)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode: 0}
						})
				})
			})
	},

// 获取一个或者批量获取,如果传入openid则表示获取单个，传入对象表示批量获取
	fetchUserInfo: function(data){ 
		// data 可能是string类型的openid，也可能是[] 数组类型类型的user_list:[{openid, lang}]
		return this.getAccessToken()
			.then((obj)=>{
				const lang = 'zh_CN';
				var userInfoUrl = '' ;
				var req ; // 表示将要发起的请求

				if (typeof data === 'string') {
					userInfoUrl = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${obj.access_token}`+
					`&openid=${data}&lang=${lang}`;
					req = request.get(userInfoUrl);
				}else if(Array.isArray(data)){
					userInfoUrl = `https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token=${obj.access_token}`
					req = request.post(userInfoUrl).type('json').send({user_list: data})
				}
				
				return new Promise((resolve, reject)=>{
					req.end((err, res)=>{
						if (err) {reject(err)} ;

						const rs = JSON.parse(res.text);
						if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
						resolve(rs); //rs 结构, 如果是获取单个用户则结构为{subscribe,openid,nickname....},批量用户为{user_info_list:[]}
					})
				})

			})
	},
	getUserList: function(nextOpenId){
		return this.getAccessToken()
			.then((obj)=>{
				
				var userListUrl = nextOpenId==null ? 
					`https://api.weixin.qq.com/cgi-bin/user/get?access_token=${obj.access_token}`:				
					`https://api.weixin.qq.com/cgi-bin/user/get?access_token=${obj.access_token}&next_openid=${nextOpenId}`;

				return new Promise((resolve, reject)=>{
					request
						.get(userListUrl)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{total,count, data:[]}
						})
				})
			})
	},

	/***********************群发消息管理****************************/

	// 根据标签进行群发
	sendMsgByTag: function(tagid, type, mediaID){ // 注意type如果是图文类型，应该写mpnews而不是news,其他类型不变
		return this.getAccessToken()
			.then((obj)=>{
				
				var sendUrl = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${obj.access_token}` ;
				var form = {
				  filter:{
				    is_to_all:false,
				    tag_id: tagid
				  },
				  [type]:{ media_id: mediaID },
				    msgtype: type
				};

				return new Promise((resolve, reject)=>{
					request
						.post(sendUrl)
						.type('json')
						.send(form)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode, errmsg, msg_id, msg_data_id}
						})
				})

			})
	},

	// 根据openid进行群发，[openid]
	sendMsgByOpenIds: function(openIds, type, mediaID){ // openids 必须传入数组[openid1, openid2]
		return this.getAccessToken()
			.then((obj)=>{
				
				var sendUrl = `https://api.weixin.qq.com/cgi-bin/message/mass/send?access_token=${obj.access_token}` ;
				var form = {
					touser: openIds,
				  [type]:{
				      media_id: mediaID
				  },
				  msgtype: type
				};

				return new Promise((resolve, reject)=>{
					request
						.post(sendUrl)
						.type('json')
						.send(form)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode, errmsg, msg_id, msg_data_id}
						})
				})

			})
	},

	// 删除群发
	// 1. 删除群发消息只能删除图文消息和视频消息，其他类型的消息一经发送，无法删除。
	// 2. 如果多次群发发送的是一个图文消息，那么删除其中一次群发，就会删除掉这个图文消息也，导致所有群发都失效
	delMassMsg: function(msgid){
		return this.getAccessToken()
			.then((obj)=>{
				
				var delMsgUrl = `https://api.weixin.qq.com/cgi-bin/message/mass/delete?access_token==${obj.access_token}` ;

				return new Promise((resolve, reject)=>{
					request
						.post(delMsgUrl)
						.type('json')
						.send({msgid: msgid})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode: 0, errmsg}
						})
				})

			})
	},

	// 预览消息
	previewMsg: function(openId){ // openId 为接受消息预览的用户的openId
		return this.getAccessToken()
			.then((obj)=>{
				var previewMsgUrl = `https://api.weixin.qq.com/cgi-bin/message/mass/preview?access_token=${obj.access_token}` ;
				var form = {
					touser: openId,
				  [type]:{
				      media_id: mediaID
				  },
				  msgtype: type
				};

				return new Promise((resolve, reject)=>{
					request
						.post(previewMsgUrl)
						.type('json')
						.send(form)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{errcode, errmsg, msg_id}
						})
				})

			})
	},

	// 查询群发消息状态
	checkMsgStatus: function(msgid){
		return this.getAccessToken()
			.then((obj)=>{
				
				var statusMsgUrl = `https://api.weixin.qq.com/cgi-bin/message/mass/get?access_token=${obj.access_token}` ;

				return new Promise((resolve, reject)=>{
					request
						.post(statusMsgUrl)
						.type('json')
						.send({msgid: msgid})
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{msg_id, msg_status}
						})
				})

			})
	},

	/*************************自定义菜单管理*********************************/

	// 创建菜单
	createMenu: function(data){
		return this.getAccessToken()
			.then((obj)=>{
				
				var cMenuUrl = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${obj.access_token}` ;

				return new Promise((resolve, reject)=>{
					request
						.post(cMenuUrl)
						.type('json')
						.send(data)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构{"errcode":0,"errmsg":"ok"}
						})
				})

			})
	},
	// 查询菜单
	getMenu: function(){
		return this.getAccessToken()
			.then((obj)=>{
				
				var rMenuUrl = `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${obj.access_token}` ;
				
				return new Promise((resolve, reject)=>{
					request
						.get(rMenuUrl)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构菜单的结构{menu:{button: []}}
						})
				})
			})
	},
	// 删除菜单
	delMenu: function(){
		return this.getAccessToken()
			.then((obj)=>{
				var dMenuUrl = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${obj.access_token}` ;
				
				return new Promise((resolve, reject)=>{
					request
						.get(dMenuUrl)
						.timeout(10000)
						.end((err, res)=>{
							if (err) {reject(err)} ;

							const rs = JSON.parse(res.text);
							if (rs.errcode && rs.errcode != 0) {reject(rs.errcode+'/'+rs.errmsg) ;}
							resolve(rs); //rs 结构菜单的结构{"errcode":0,"errmsg":"ok"}
						})
				})
			})
	},

}

const instance = new Wechat(wConfig);

module.exports = instance ; // 暴露单例