// 数据库类型
export const dbType = {
    savePath: 'savePath', // 默认下载路径保存信息
    downloadListInfo: 'downloadListInfo', // 下载列表信息
}

// 文件下载状态
export const downloadStatus = {
    default: '未开始', // 未开始
    downloading: '下载中', // 下载中
    downloaded: '下载完成', // 下载完成
    error: '下载失败', // 下载失败
    cancel: '下载取消', // 下载取消
    pause: '下载暂停', // 下载暂停
    decrypting: '解密中', // 解密中
    decrypted: '解密成功', // 解密成功
    decryptError: '解密失败', // 解密失败
    needRestartDecrypt: '需要重新解密', // 需要重新解密
}


