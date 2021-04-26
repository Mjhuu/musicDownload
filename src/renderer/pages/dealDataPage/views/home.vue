<template>
<div>
  页面2
</div>
</template>

<script>
import fs from "fs";
import {clipboard} from "electron";
// import {request} from 'http'
import request from 'request'
import aesjs from 'aes-js'
import {downloadStatus} from "../../../data";
import {RSAUtil} from "../../../common/rsa";

function aesDecrypt(data, key, isHex = false) {
  data = isHex ? aesjs.utils.hex.toBytes(data) : data;
  let aesCtr = new aesjs.ModeOfOperation.ctr(key);
  return aesCtr.decrypt(data)
}

export default {
  name: "home",
  mounted() {
    this.$electron.ipcRenderer.on('fromRenderData', (e, a, winId) => {
      console.log(a);
      // winId 猪渲染进程的ID
      // 获取主进程对象
      let mainWindow = this.$electron.remote.BrowserWindow.fromId(winId);
      if(a.type === 'RSAUtil'){
        // 处理私钥公钥
        let keyPair = RSAUtil.getRSAKeyPair();
        mainWindow.webContents.send('getKeyPaired', {
          keyPair,
          type: 'RSAUtil', fileObj: a.fileObj
        })
        return
      }

      let {index, fileObj} = a;
      let {skey, savePath, mikey} = fileObj;
      mikey = JSON.parse(mikey);

      mainWindow.webContents.send('decrypting', {
        index,
        status: downloadStatus.decrypting,
        decryptProgress: 0,
        id: fileObj.id
      })


      let path = savePath;
      let arr = path.split('.');
      arr.pop();
      let newPath = arr.join('.')
      console.log(newPath);
      const wstream = fs.createWriteStream(newPath);
      wstream.on('open', () => {
        // 读文件
        let encryptFile = fs.readFileSync(path)
        // 加密的文件二进制数据
        let encryptArray = new Uint8Array(encryptFile);
        console.log(encryptArray);
        // console.log(encryptArray.length);
        let size = encryptArray.length;
        let shardSize = size / 100;
        // 如果分片小于5M则用5M进行分片
        if(shardSize < 1048576 * 5){
          shardSize = 1048576 * 5;   //以20MB为一个分片,每个分片的大小
        }
        // 如果分片大于20M则用20M进行分片
        if(shardSize > 1048576 * 20){
          shardSize = 1048576 * 20;  //以20MB为一个分片,每个分片的大小
        }
        let shardCount = Math.ceil(size / shardSize);   //总片数
        let dealSize = 0;
        for(let fileIndex = 0; fileIndex< shardCount; fileIndex++){
          let start = fileIndex * shardSize;
          let end;
          if(shardCount === fileIndex + 1){
            shardSize = size - fileIndex * shardSize;
            end = size;
          }else {
            end = start + shardSize;
          }
          // console.log(shardCount, shardSize, start, end);
          let blockUint8Arr = encryptArray.slice(start, end);
          // console.log(blockUint8Arr);
          // 对文加密件数组进行解密
          let decryptFileArr = aesDecrypt(blockUint8Arr, aesDecrypt(skey, mikey, true));
          console.log('解密服务端的加密文件的二进制数组', '第'+fileIndex+'片', new Buffer(decryptFileArr));
          wstream.write(new Buffer(decryptFileArr));
          dealSize += decryptFileArr.length;
          mainWindow.webContents.send('decrypting', {
            index,
            status: downloadStatus.decrypting,
            decryptProgress: (dealSize / size) * 100,
            id: fileObj.id
          })
        }
        wstream.end();
      })
      wstream.on('error', (err) => {
        console.error(err);
      });
      wstream.on('finish', () => {
        console.log('文件写入成功');
        // '数据处理完毕，返回主进程'
        mainWindow.webContents.send('decrypted', {
          index,
          status: downloadStatus.decrypted,
          decryptProgress: 100,
          id: fileObj.id
        })
        fs.unlink(path, err => {
          if(err){
            return err
          }
          console.log('删除成功');
        })
      });

      console.log('来自朱渲染进程的',a, winId);
    })
  }
}
</script>

<style scoped lang="stylus" ref="stylesheet/stylus">

</style>
