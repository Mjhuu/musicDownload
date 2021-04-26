<template>
  <div>
    <a-input
        style="width: 60%;text-align: center;opacity: .9;"
        allowClear
        placeholder="请输入云盘下载链接"
        size="large"
        v-model="originalUrl"
        @pressEnter="getEncryptFile"
        clearable>
    </a-input>

    <a-button @click="stopDownload">暂停下载</a-button>
    <a-button @click="continueDownload">打开新窗口</a-button>
    <a-button @click="addData">添加数据</a-button>
    <a-button @click="getData">获取数据</a-button>
    <a-button @click="updateData">修改数据</a-button>
    <a-button @click="delData">删除数据</a-button>
  </div>
</template>

<script>
import fs from "fs";
import path from "path";
import {clipboard, remote} from "electron";
// import {request} from 'http'
import request from 'request'
import aesjs from 'aes-js'
import {getDataFromDB, delDataFromDB, addDataToDB, updateDataToDB} from './../../../common/db'

function aesDecrypt(data, key = [12, 22, 23, 34, 5, 36, 37, 8, 9, 110, 11, 2, 31, 14, 36, 162], isHex = false) {
  data = isHex ? aesjs.utils.hex.toBytes(data) : data;
  let aesCtr = new aesjs.ModeOfOperation.ctr(key);
  return aesCtr.decrypt(data)
}

export default {
  name: "news",
  data(){
    return{
      originalUrl: '',
      response: null,
      request: null,
    }
  },
  mounted() {
    let content = clipboard.readText();
    console.log(content);
    this.originalUrl = content;
    // 当前程序安装路径 path.dirname(remote.app.getPath('exe'))
    console.log(this.originalUrl = path.dirname(remote.app.getPath('exe')));
    /*
    // 测试
    let path = 'F:\\jianghu_college\\electron_demo\\测试云盘的下载文件\\Hadoop构建数据仓库实践.pdf.weblink';
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
        let decryptFileArr = aesDecrypt(blockUint8Arr, aesDecrypt('26a4dc96d62470c233eacac8f1ffef79', [12, 22, 23, 34, 5, 36, 37, 8, 9, 110, 11, 2, 31, 14, 36, 162], true));
        console.log('解密服务端的加密文件的二进制数组', '第'+fileIndex+'片', new Buffer(decryptFileArr));
        wstream.write(new Buffer(decryptFileArr));
      }
      wstream.end();
    })
    wstream.on('error', (err) => {
      console.error(err);
    });
    wstream.on('finish', () => {
      console.log('文件写入成功');
    });*/

    this.$electron.ipcRenderer.on('fromNewWindowData',(e, a) => {
      console.log('新进程传来的：',a);
    })
  },
  methods: {
    async addData(){
      let data = await addDataToDB({
        id: 1
      }).catch(err => console.error(err));
      console.log(data);
    },
    async getData(){
      let data = await getDataFromDB({
        id: 1
      }).catch(err => console.error(err));
      console.log(data);
    },
    async updateData(){
      let data = await updateDataToDB({
        id: 1
      }, {txt: '修改存在', id: 2}).catch(err => console.error(err));
      console.log(data);
    },
    async delData(){
      let data = await delDataFromDB({
        id: 1
      }).catch(err => console.error(err));
      console.log(data);
    },
    // 获取加密文件
    async getEncryptFile(){
      let {originalUrl = ''} = this;
      console.log(originalUrl);
      let strArr = originalUrl.split('&');
      console.log(strArr);
      let Token = '';
      let DownloadUrl = '';
      let arr = strArr.filter((i, k) => {
        let arr = i.split('=');
        if(arr[0] === 'token'){
          Token = arr[1];
          return false
        }
        if(arr[0] === 'downloadUrl'){
          DownloadUrl = arr[1];
          return false
        }
        return true
      })
      // 获取的下载链接
      let url = arr.join('&');
      // console.log({url, Token, DownloadUrl});
      // 获取文件下载信息
      let res = await this.$http.get(url, {
        headers: {
          'Token': Token
        }
      });
      if(res.data.code === 200){
        // console.log(res.data.data);
        let {fileName, size, skey, token} = res.data.data;
        size = Number(size);
        this.$electron.remote.dialog.showOpenDialog({ properties:['openFile','openDirectory'] }, async (files) => {
          if(files){
            // 加密文件下载
            let path = `${files[0]}/${fileName}.weblink`;
            let received_bytes = 0;//已经接收到的集结 136635866
            let total_bytes = size;//总字节
            console.log({'存储路径': path, '已经接收到的字节' :received_bytes, '总字节':total_bytes});
            try{
              let stats = fs.statSync(path);//如果文件已存在读取文件信息
              console.log('已存在此文件的目录信息', stats);
              if(total_bytes === stats.size){//如果文件已经存在并且已经下载按成则跳过该文件
                return;
              }
              received_bytes = stats.size;
              console.log('已经接收到的字节', received_bytes);
            }catch (err){
              console.log('不存在');
            }
            let params ={
              "method": 'GET',
              // "url": `https://vd2.bdstatic.com/mda-mb5qjwi5dvjugars/sc/cae_h264_clips/1612608290/mda-mb5qjwi5dvjugars.mp4?auth_key=1616634694-0-0-da1b6846b29b8798fc7fbdaacc764706&bcevod_channel=searchbox_feed&pd=1&pt=3&abtest=`,
              "url": `${DownloadUrl}?token=${encodeURIComponent(token)}`,
              headers: {
                'Range': `bytes=${received_bytes}-`,
                'Token': Token,
              }
            };
            let req = request(params);
            console.log(req);
            this.request = req;
            let out = fs.createWriteStream(path, received_bytes === 0 ? {} : {
              start: received_bytes,
              flags: 'r+'
            });//创建文件写入

            req.pipe(out);
            req.on('response', ( response ) => {
              console.log(response);
              console.log(response.headers['content-type']);
              console.log('content-length');
              console.log(response.headers['content-length']);
              console.log('Content-Range');
              console.log(response.headers['content-Range']);
              let startTime = new Date().getTime();
              console.log({startTime});
              this.response = response;
            });
            //接收到文件流事件
            req.on('data', (chunk) => {
              console.log(chunk);
              received_bytes += chunk.length;
              console.log({received_bytes});
            });
            //文件接收结束
            req.on('end', () => {
              console.log(`file download complete`);
              if(received_bytes >= total_bytes){
                console.log('完毕');
              }
            });
          }
        })
      }
    },
    stopDownload(){
      console.log(this.response);
      // this.response.socket.end(); // or res.socket.destroy();
      console.log('停止了');
      console.log(this.request);
      this.request.abort()
    },
    continueDownload(){
      // this.getEncryptFile()
      this.$electron.ipcRenderer.send('openNewWindow','打开新窗口，我是需要处理的文件对象')
      // this.$ipcRenderer.send('dealFileData', '我是渲染进程里面的文件数据')
    },
  }
}
</script>

<style scoped>

</style>
