const xml2js = require('xml2js');
const tpl = require('./tpl');
const sha1 = require('sha1');

// 生成{xml: {}} 这样的json对象格式
function parseXML(xml){
	return new Promise((resolve, reject)=>{
			xml2js.parseString(xml, {trim: true}, (err, content)=>{
				if(err) reject(err);
				resolve(content);
			})
	})
}

// 格式化过程，必须传入对象类型数据，需考虑：
// 1.嵌套数组的情况（必须使用递归）
// 2.多元素数组的情况 3.单元素数组的情况。
// 4.空数组
function formatXML(data){
	const msg = {} ;
	if (typeof data ==='object') {
		for(var key in data){
			var value = data[key];
			// console.log(`${key}=>${value}`)
			// 1. 不是数组不处理。
			if( !Array.isArray(value) || value.length == 0){
				continue;
			}

			// 2.处理值为数组的情况
			if(value.length == 1){
				var item = value[0] ;
				if(typeof item === 'object'){
					msg[key] = formatXML(item) ;
					console.log('发生递归')
				}else{
					msg[key] = (item || '').trim() ;
				}
			}else{
				// 3.处理多元素数组
				msg[key] = [] ;
				value.forEach((item, index)=>{
					msg[key].push(parseXML(item))
					console.log('发生数组递归')
				})
			}
		}
	}
	return msg;
}

/*接受xml字符串，生成json对象*/
exports.xml2JSON = function* (xml){
	const data = yield parseXML(xml) ;
	const json = formatXML(data.xml) ;
	return json;
}

/*从模板渲染回复的消息,重点是生成不同类型从content*/
exports.renderMsg = function(rawReply, recvMsg){
	// 组装渲染回复消息所需的对象
	const msgType = (rawReply&&rawReply.type) || 'text' ;
	const content = (rawReply&&rawReply.content) || '没有设置消息，返回缺省值';
	var info = {
		toUserName: recvMsg.FromUserName,
		fromUserName: recvMsg.ToUserName,
		msgType: msgType, // 这里是回复消息的类型，而不是recvMsg的类型
		content: content // content是回复的具体值，需要嵌入到xml的合适位置去才能返回给微信
	} ;
	return tpl(info);
}


/*jsapi_ticket 签名算法，得到签名值*/
exports.ticketSign = function(noncestr, ticket, timestamp, url){
	var tmp = [
		`jsapi_ticket=${ticket}`,
		`noncestr=${noncestr}`,
		`timestamp=${timestamp}`,
		`url=${url}`
	];
	const rs = tmp.sort().join('&');
	return sha1(rs) ;
}


// 将fs的api进行promise化，好进行yield调用

exports.readFile = function(path){
		return new Promise((resolve, reject)=>{
			fs.readFile(path, (err, data)=>{
				if (err) {reject(err)}
				else{
					resolve(data);
				}
			})
		})
	},

exports.writeFile= function(data, path){
		return new Promise((resolve, reject)=>{
			fs.writeFile(path, data, err=>{
				if (err) {reject(err)}
				else{
					resolve(true);
				}
			})
		})
	}