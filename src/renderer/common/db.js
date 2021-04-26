import db from './../datastore.js'

/**
 * 添加数据
 * @param data
 * @returns {Promise<unknown>}
 */
export function addDataToDB(data = {id: 1}) {
    return new Promise((resolve, reject) => {
        db.insert(data, function (err, doc) {
            if (err) {
                return reject(err)
            }
            resolve(doc);
        })
    })
}

/**
 * 修改数据
 * @param data
 * @param newData
 * @returns {Promise<unknown>}
 */
export function updateDataToDB(data = {id: 1}, newData = {name: 'Mjhu'}) {
    return new Promise((resolve, reject) => {
        db.update(data, {
            $set: newData
        }, function (err, doc) {
            if (err) {
                return reject(err)
            }
            resolve(doc);
        })
    })
}

/**
 * 删除数据
 * @param data
 * @returns {Promise<unknown>}
 */
export function delDataFromDB(data = {id: 1}) {
    return new Promise((resolve, reject) => {
        db.remove(data,{},function(err, doc){
            if(err){
                return reject(err)
            }
            resolve(doc);
        })
    })
}

/**
 * 获取数据
 * @param data
 * @returns {Promise<unknown>}
 */
export function getDataFromDB(data = {id: 1}) {
    return new Promise((resolve, reject) => {
        db.find(data, function (err, doc) {
            //获取查询的数据
            if (err) {
                return reject(err)
            }
            resolve(doc);
        })
    })
}


