module.exports = {

    button: [{
        // 第一个一级菜单
        name: '点击事件',
        type: 'click',
        key: 'menu_click'
    }, {
        // 第二个一级菜单
        name: '弹出菜单',
        sub_button: [{
            name: '跳转url',
            type: 'view',
            url: 'http://baidu.com'
        }, {
            name: '扫码推送事件',
            type: 'scancode_push',
            key: 'scancode_push'
        }, {
            name: '扫码事件',
            type: 'scancode_waitmsg',
            key: 'scancode_waitmsg'
        }, {
            name: '弹出系统拍照',
            type: 'pic_sysphoto',
            key: 'pic_sysphoto'
        }, {
            name: '拍照或者相册',
            type: 'pic_photo_or_album',
            key: 'pic_photo_or_album'
        }]
    }, {
        // 第三个一级菜单
        name: '第三个菜单',
        sub_button: [{
            name: '弹出相册',
            type: 'pic_weixin',
            key: 'pic_weixin'
        }, {
            name: '地理位置',
            type: 'location_select',
            key: 'location_select'
        }, {
            name: '下发媒体消息',
            type: 'media_id',
            media_id: 'ypkVD77Q4h1m4PpKF-q0Rfq_1pBsvfw3OlijyC7WfK8'
        }, {
            name: '跳转图文消息',
            type: 'view_limited',
            media_id: 'ypkVD77Q4h1m4PpKF-q0Rfq_1pBsvfw3OlijyC7WfK8'
        }]
    }]
}
