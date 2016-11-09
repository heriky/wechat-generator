/* 用于定制不同类型消息的模板 */
const TYPE_TEXT = 'text' ;
const TYPE_IMG = 'image';
const TYPE_VOICE = 'voice';
const TYPE_VIDEO = 'video';
const TYPE_MUSIC = 'music';
const TYPE_NEWS = 'news';

// info中应该包含系统为用户回复的消息的所有信息
// var info = {
// 	toUserName,
// 	fromUserName,
// 	createTime, 这个字段直接在模板字符串中写+new Date()即可
// 	msgType,
// 	content, 
// 	
// 	这里content根据具体回复消息的不同会有不同的结构
// 	文本消息 -> content -> string
// 	图片消息 -> content -> string/number  (media_id)
// 	语音消息 -> content -> string/number  (media_id)
// 	视频消息 -> content -> object  {mediaID, title, description}
// 	音乐消息 -> content -> object  {title, description, musicUrl, hqMusicUrl, thumbMediaId}
// 	图文消息 -> content -> array(obj) [{title, description, picUrl, url},{}]
// }
module.exports = function(info){ 
	// 根据不同的消息类型，生成不同的消息体结构，然后插入到回复消息的xml中去
	var type= TYPE_TEXT ;
	var content_tpl = '<Content><![CDATA[默认值，用于测试!]]></Content>'; 
	
	switch(info.msgType){
		case TYPE_TEXT:
			type = TYPE_TEXT;
			content_tpl = `<Content><![CDATA[${info.content}]]></Content>` ; //info.content表示文字内容
			break;

		case TYPE_IMG:
			type = TYPE_IMG;
			content_tpl = `
			<Image>
			<MediaId><![CDATA[${info.content}]]></MediaId>
			</Image>`.trim();
			break;

		case TYPE_VOICE:
			type = TYPE_VOICE;
			content_tpl = `
			<Voice>
			<MediaId><![CDATA[${info.content}]]></MediaId>
			</Voice>`.trim();
			break;

		case TYPE_VIDEO:
			type = TYPE_VIDEO;
			var content = info.content;
			content_tpl = `
			<Video>
			<MediaId><![CDATA[${content.mediaID}]]></MediaId>
			<Title><![CDATA[${content.title}]]></Title>
			<Description><![CDATA[${content.description}]]></Description>
			</Video> `.trim();
			break;

		case TYPE_MUSIC:
			type = TYPE_MUSIC;
			var content = info.content;
			//title, description, musicUrl, hqMusicUrl, thumbMediaId
			content_tpl = `
			<Music>
			<Title><![CDATA[${content.title}]]></Title>
			<Description><![CDATA[${content.description}]]></Description>
			<MusicUrl><![CDATA[${content.musicUrl}]]></MusicUrl>
			<HQMusicUrl><![CDATA[${content.hqMusicUrl}]]></HQMusicUrl>
			<ThumbMediaId><![CDATA[${content.thumbMediaId}]]></ThumbMediaId>
			</Music>`.trim();
			break;

		case TYPE_NEWS:
			type = TYPE_NEWS;
			var content = info.content;
			//[{title, description, picUrl, url},{}]
			
			const count = content.length ;
			content_tpl = `<ArticleCount>${count}</ArticleCount><Articles>` ;
			
			for(var i=0; i<count; i++){
				var data = content[i] ;
				content_tpl += `
				<item>
				<Title><![CDATA[${data.title}]]></Title> 
				<Description><![CDATA[${data.description}]]></Description>
				<PicUrl><![CDATA[${data.picUrl}]]></PicUrl>
				<Url><![CDATA[${data.url}]]></Url>
				</item>
				`;
			}
			content_tpl = (content_tpl+'</Articles>').trim();
			break;
		default:
			throw new Error('Invalid Message Type, by hk.')
	}
	
	// 添加消息的通用信息
	var reply_tpl = `
	<xml>
	<ToUserName><![CDATA[${info.toUserName}]]></ToUserName>
	<FromUserName><![CDATA[${info.fromUserName}]]></FromUserName>
	<CreateTime>${+new Date()}</CreateTime>
	<MsgType><![CDATA[${type}]]></MsgType>
	${content_tpl}
	</xml>`.trim() ;

	return reply_tpl;
}

