
export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function setCache(key, value){
    localStorage.setItem(key, value)
}

export function getCache(key){
    return localStorage.getItem(key)
}

export function delCache(key){
    localStorage.removeItem(key)
}

/**
 * 去空格
 * @param v
 * @returns {*}
 */
export function trim(v) {
    return v.replace(/^\s*|\s*$/g, "")
}

/**
 * 是否是base64
 * @param str
 * @returns {boolean}
 */
export function isBase64(str){
    if(str === '' || str.trim() === ''){
        return false;
    }
    try{
        return btoa(atob(str)) === str;
    }catch(err){
        return false;
    }
}


