
/*动态处理文件大小*/
function dealFileSize(limit) {
    limit = Number(limit)
    let size;
    if (limit < 0.1 * 1024) {                            //小于0.1KB，则转化成B
        size = limit.toFixed(2) + "B"
    } else if (limit < 0.1 * 1024 * 1024) {            //小于0.1MB，则转化成KB
        size = (limit / 1024).toFixed(2) + "K"
    } else if (limit < 0.1 * 1024 * 1024 * 1024) {        //小于0.1GB，则转化成MB
        size = (limit / (1024 * 1024)).toFixed(2) + "M"
    } else {                                            //其他转化成GB
        size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "G"
    }

    let sizeStr = size + "";                        //转成字符串
    let index = sizeStr.indexOf(".");                    //获取小数点处的索引
    let dou = sizeStr.substr(index + 1, 2)            //获取小数点后两位的值
    if (dou === "00") {                                //判断后两位是否为00，如果是则删除00
        return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
    }
    return size;
}

/**
 * 秒转时分秒
 * @param value
 * @returns {string}
 */
function formatSeconds(value) {
    let theTime = parseInt(value);// 秒
    let middle = 0;// 分
    let hour = 0;// 小时

    if (theTime > 60) {
        middle = theTime / 60;
        theTime = theTime % 60;
        if (middle > 60) {
            hour = middle / 60;
            middle = middle % 60;
        }
    }
    let result = " " + parseInt(theTime) + " 秒";
    if (middle > 0) {
        result = " " + parseInt(middle) + " 分 " + result;
    }
    if (hour > 0) {
        result = " " + parseInt(hour) + " 小时 " + result;
    }
    return result;
}

export {dealFileSize, formatSeconds}
