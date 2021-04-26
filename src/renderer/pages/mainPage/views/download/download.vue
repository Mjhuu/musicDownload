<template>
<div id="download">
<!-- 当前文件保存路径 -->
  <section class="file-save-path">
    <span>当前文件保存路径</span>
    <a-input style="width: 500px;margin: 0 10px;" placeholder="文件保存路径" v-model="savePath" :disabled="true" />
    <a-button @click="selectSavePath">
      重新选择
    </a-button>
  </section>
<!-- 输入文件下载链接 -->
  <section class="download-box">
    <a-input
        style="width: 60%;text-align: center;opacity: .9;"
        allowClear
        placeholder="请输入云盘下载链接"
        v-model="originalUrl"
        clearable>
    </a-input>
    <a-button type="primary" :loading="loading" @click="addDownload">创建下载任务</a-button>
  </section>

  <a-tabs style="margin-top: 15px;" type="card" @change="tabChange">
    <a-tab-pane v-model="tabValue" key="downloading" tab="正在下载">
      <section class="download-list">
        <div v-for="(i) in downloadList" :key="i.originalUrl" class="item">
          <template v-if="!i.hidden && i.status !== downloadStatus.decrypted">
            <section class="middle">
              <!--    文件名    -->
              <section class="fileName">
                <div class="left" @click="openItem(i)" title="打开文件">
                  <a-tag v-if="i.formType === 'shared'" color="#87d068" style="transform: scale(.8)">分享
                  </a-tag> {{i.fileName}}
                </div>
                <div class="right">
                  {{i.size | dealFileSize}}
                </div>
              </section>
              <!--   下载/解密进度条   -->
              <a-progress style="opacity: .9;" :percent="(i.status === downloadStatus.decrypting || i.status === downloadStatus.decrypted || i.status === downloadStatus.decryptError || i.status === downloadStatus.needRestartDecrypt) ? Math.ceil(i.decryptProgress) : Math.ceil(i.downloadProgress)">
                <template v-slot:format="percent">
                  <span style="color: #ccc">{{percent}}%</span>
                </template>
              </a-progress>
              <div class="status-box">
                <div class="left">
                  状态：{{i.status}} <span v-if="i.status === downloadStatus.downloading" class="speed">{{i.speed | dealFileSize}}/s</span><span v-if="i.status === downloadStatus.downloading && i.remainSecond" class="remainSecond">预计还剩{{ i.remainSecond | formatSeconds}}</span><span v-if="i.status === downloadStatus.downloading && !i.remainSecond" class="remainSecond">预计还剩---s</span>
                </div>
                <div class="right">
                  <template v-if="i.status === downloadStatus.needRestartDecrypt">
                    <a-button size="small" @click="restartDecrypt(i)">
                      重新解密
                    </a-button>
                  </template>
                  <template v-else>
                    <!--   暂停下载   -->
                    <a-button size="small" @click="stopDownload(i)" :disabled="i.status !== downloadStatus.downloading">
                      暂停
                    </a-button>
                    <!--   继续下载   -->
                    <a-button size="small" @click="continueDownload(i)" :disabled="i.status !== downloadStatus.pause">
                      继续
                    </a-button>
                  </template>
                  <!--   取消下载   -->
                  <a-popconfirm
                      title="确认删除此下载任务吗?"
                      ok-text="确认"
                      cancel-text="再想想"
                      v-if="i.status !== downloadStatus.decrypting"
                      @confirm="cancelDownload(i)"
                  >
                    <a-button size="small" type="danger">
                      删除
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>
              <div class="path" @click="showItemInFolder(i)" title="打开文件所在目录">保存路径：{{i | realPath}}</div>
            </section>
          </template>
        </div>

        <!-- 下载列表 -->
        <a-empty style="margin-top: 100px;" v-if="this.downloadList.filter(i => !i.hidden && i.status !== downloadStatus.decrypted).length === 0" description="暂无下载任务" />
        <p v-else style="height: 40px;display: flex;justify-content: center;align-items: center;color: rgb(171, 171, 171);font-size: 14px;">已经到底了</p>
      </section>
    </a-tab-pane>
    <a-tab-pane key="downloaded" tab="下载完成">
      <section class="download-list">
        <div class="action">
      <span v-if="downloadList.filter(i => !i.hidden && i.status === downloadStatus.decrypted).length > 0" class="delete" @click="delDecryptedList">
        清空已完成记录
      </span>
        </div>
        <div v-for="(i) in downloadList" :key="i.originalUrl" class="item">
          <template v-if="!i.hidden && i.status === downloadStatus.decrypted">
            <section class="middle">
              <!--    文件名    -->
              <section class="fileName">
                <div class="left" @click="openItem(i)" title="打开文件">
                  <a-tag v-if="i.formType === 'shared'" color="#87d068" style="transform: scale(.8)">分享
                  </a-tag> {{i.fileName}}
                </div>
                <div class="right">
                  {{i.size | dealFileSize}}
                </div>
              </section>
              <!--   下载/解密进度条   -->
              <a-progress style="opacity: .9;" :percent="(i.status === downloadStatus.decrypting || i.status === downloadStatus.decrypted || i.status === downloadStatus.decryptError || i.status === downloadStatus.needRestartDecrypt) ? Math.ceil(i.decryptProgress) : Math.ceil(i.downloadProgress)">
                <template v-slot:format="percent">
                  <span style="color: #ccc">{{percent}}%</span>
                </template>
              </a-progress>
              <div class="status-box">
                <div class="left">
                  状态：{{i.status}} <span v-if="i.status === downloadStatus.downloading" class="speed">{{i.speed | dealFileSize}}/s</span><span v-if="i.status === downloadStatus.downloading && i.remainSecond" class="remainSecond">预计还剩{{ i.remainSecond | formatSeconds}}</span><span v-if="i.status === downloadStatus.downloading && !i.remainSecond" class="remainSecond">预计还剩---s</span>
                </div>
                <div class="right">
                  <template v-if="i.status === downloadStatus.needRestartDecrypt">
                    <a-button size="small" @click="restartDecrypt(i)">
                      重新解密
                    </a-button>
                  </template>
                  <template v-else>
                    <!--   暂停下载   -->
                    <a-button size="small" @click="stopDownload(i)" :disabled="i.status !== downloadStatus.downloading">
                      暂停
                    </a-button>
                    <!--   继续下载   -->
                    <a-button size="small" @click="continueDownload(i)" :disabled="i.status !== downloadStatus.pause">
                      继续
                    </a-button>
                  </template>
                  <!--   取消下载   -->
                  <a-popconfirm
                      title="确认删除此下载任务吗?"
                      ok-text="确认"
                      cancel-text="再想想"
                      v-if="i.status !== downloadStatus.decrypting"
                      @confirm="cancelDownload(i)"
                  >
                    <a-button size="small" type="danger">
                      删除
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>
              <div class="path" @click="showItemInFolder(i)" title="打开文件所在目录">保存路径：{{i | realPath}}</div>
            </section>
          </template>
        </div>

        <!-- 下载列表 -->
        <a-empty style="margin-top: 100px;" v-if="this.downloadList.filter(i => !i.hidden && i.status === downloadStatus.decrypted).length === 0" description="暂无完成任务" />
        <p v-else style="height: 40px;display: flex;justify-content: center;align-items: center;color: rgb(171, 171, 171);font-size: 14px;">已经到底了</p>
      </section>
    </a-tab-pane>
  </a-tabs>
</div>
</template>

<script>
import path from "path";
import {clipboard, remote} from "electron";
import {addDataToDB, getDataFromDB, updateDataToDB} from './../../../../common/db'
import {dbType, downloadStatus} from './../../../../data'
import fs from "fs";
import request from "request";
import {RSAUtil} from "../../../../common/rsa";
import {isBase64, trim} from "../../../../common";
import {BASE_URL} from '../../../../../Api'

// 默认的文件保存路径
let defaultSavaPath = path.dirname(remote.app.getPath('exe'));
let timer = null;
let flag = true;

export default {
  name: "download",
  data(){
    return{
      // 文件保存路径
      savePath: defaultSavaPath,
      // 是否修改过默认保存路径
      isUpdateSavePath: false,
      // 是否将下载记录进行本地保存
      hasDownloadList: false,
      // 当前输入框内的链接值
      originalUrl: '',
      // 云盘下载列表
      downloadList: [],
      downloadStatus,
      // 新建下载任务loading
      loading: false,
      // tab
      tabValue: 'downloading',

      // 密钥对
      keypair: RSAUtil.getRSAKeyPair(),
      // 实时监听剪切板事件
      clipboardTimer: null
    }
  },
  mounted() {
    this.init();
    // 数据处理完毕
    this.$electron.ipcRenderer.on('decrypted',(e, a) => {
      if(a.id){
        let index = this.downloadList.findIndex(i => i.id === a.id);
        if(index !== -1){
          let item = this.downloadList[index];
          item.status = a.status;
          item.decryptProgress = a.decryptProgress;
          this.$set(this.downloadList, index, item);
          this.$message.success({
            key: 'decryptSuccess',
            content: `《${item.fileName}》文件解密成功`
          });
          // 关闭解密进程
          this.$electron.ipcRenderer.send('decryptWindow-close', {
            id: item.id
          });
        }
      }
    })
    // 数据处理中
    this.$electron.ipcRenderer.on('decrypting',(e, a) => {
      if(a.id){
        let index = this.downloadList.findIndex(i => i.id === a.id);
        if(index !== -1){
          let item = this.downloadList[index];
          item.status = a.status;
          item.decryptProgress = a.decryptProgress;
          this.$set(this.downloadList, index, item);
        }
      }
    });
    // 获取密钥对
    this.$electron.ipcRenderer.on('getKeyPaired',async (e, a) => {
      if(a.type === 'RSAUtil'){
        this.$message.loading({
          key: 'RSAUtil',
          content: '分享链接处理中……',
          duration: 1
        });
        // 关闭获取密钥对进程
        this.$electron.ipcRenderer.send('decryptWindow-close', {
          id: a.fileObj.id
        });
        // console.log(a.keyPair, a.fileObj);
        let {url, Token, DownloadUrl, originalUrl} = a.fileObj;
        url = `${url}&publicKey=${trim(a.keyPair.publicKey)}`;
        // 获取分享者的密钥
        let res = await this.fetchDecryptFileInfo({
          url, Token
        });
        let {fileName, size, skey, token, mikey: encrypted} = res;
        let mikey = RSAUtil.privateKeyDecrypt(encrypted, a.keyPair.privateKey);
        mikey = mikey.toString('utf8');
        // 加密文件下载
        let path = `${this.savePath}/${fileName}.weblink`;

        let item = {
          // 下载任务ID
          id: Date.now(),
          // 云盘下载链接
          originalUrl: originalUrl,
          // 当前下载请求
          request: null,
          // 当前文件状态
          status: downloadStatus.default,
          // 当前文件下载进度
          downloadProgress: 0,
          // 解密进度
          decryptProgress: 0,
          // 保存的下载路径
          savePath: path,
          // 文件名
          fileName,
          // 文件大小
          size,
          // 用户的密钥
          mikey,
          // 密钥Hex
          skey,
          // 浏览器传来的获取文件信息的下载地址
          preDownloadUrl: url,
          // 下载地址
          DownloadUrl,
          downloadUrl: `${DownloadUrl}?token=${encodeURIComponent(token)}`,
          // 用户Token
          Token,
          // 是否隐藏
          hidden: false,
          // 定时器
          timer: null,
          // 下载速度
          speed: 0,
          // 剩余下载时间
          remainSecond: 0,
          // 文件来源
          formType: 'shared'
        }
        // 添加到下载任务
        this.dealDownloadList(item);

        // 下载
        this.download(item, res)
      }
    });
    // 实时监听剪切板事件
    this.listenClipboardTimer();
  },
  destroyed() {
    clearInterval(this.clipboardTimer)
  },
  filters: {
    realPath(i){
      let arr = i.savePath.split('.');
      arr.pop();
      return i.status === downloadStatus.decrypted ? arr.join('.') : i.savePath
    }
  },
  watch: {
    downloadList(newV, oldV){
      if(!flag){
        return
      }
      clearTimeout(timer);
      flag = false;
      timer = setTimeout(async () => {
        flag = true;
        let downloadList = newV.map(i => {
          return Object.assign({...i}, {request: null, timer: null})
        });
        if(this.hasDownloadList){
          // 如果保存过则修改
          let data = await updateDataToDB({
            type: dbType.downloadListInfo
          }, {
            downloadList: JSON.stringify(downloadList)
          });
          if(data){
            console.log('下载列表信息修改成功');
          }
        }else {
          // 新增数据
          // 如果尚未修改过默认路径调用新增方法
          let data = await addDataToDB({
            type: dbType.downloadListInfo,
            downloadList: JSON.stringify(downloadList)
          });
          if(data){
            this.hasDownloadList = true;
            console.log('下载列表信息新增成功');
          }
        }

      }, 200)
    }
  },
  methods: {
    // 实时监听剪切板事件
    listenClipboardTimer(){
      this.clipboardTimer = setInterval(() => {
        let originalUrl = clipboard.readText();
        if(this.originalUrl !== originalUrl){
          if(isBase64(originalUrl) && window.atob(originalUrl).includes(`${BASE_URL}/pre-download?fileId=`)){
            // 获取剪切板内容
            this.originalUrl = originalUrl;
            this.$destroyAll();
            this.$confirm({
              key: 'listenClipboardTimer',
              title: '检测到新的下载链接',
              content: '有新的下载任务，是否立即下载？',
              onOk:() =>{
                this.addDownload()
              },
            });
          }
        }
      }, 1000)
    },
    // tab切换
    tabChange(v){
      // console.log(v, this.tabValue);
    },
    // 打开文件所在目录
    showItemInFolder(item){
      if(item.status !== downloadStatus.decrypted){
        return this.$message.warning({
          key: 'openFileError',
          content: `《${item.fileName}》文件尚未下载完毕`
        })
      }
      let arr = item.savePath.split('.');
      arr.pop();
      remote.shell.showItemInFolder(arr.join('.'))
    },
    // 打开文件
    openItem(item){
      if(item.status !== downloadStatus.decrypted){
        return this.$message.warning({
          key: 'openFileError',
          content: `《${item.fileName}》文件尚未下载完毕`
        })
      }
      let arr = item.savePath.split('.');
      arr.pop();
      try {
        let stats = fs.statSync(arr.join('.'));

        remote.shell.openItem(arr.join('.'))
      }catch (e) {
        this.$message.warning({
          key: 'noFIle',
          content: '文件或目录不存在'
        })
      }

    },
    // 处理下载链接
    dealOriginalUrl(originalUrl){
      if(!isBase64(originalUrl)){
        return this.$message.warning({
          key: 'errorTip',
          content: '请输入纬领云盘合法下载链接'
        })
      }
      originalUrl = window.atob(originalUrl);
      let {downloadList = []} = this;
      let item = downloadList.filter(i => i.originalUrl === originalUrl)[0];
      if(item){
        if(item.hidden){
          // 获取下载列表的索引
          let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);

          item.hidden = false;
          this.$set(this.downloadList, index, item);
        }else {
          return this.$message.warning({
            key: 'errorTip',
            content: '已存在此下载任务'
          })
        }
      }
      if(!originalUrl.includes(`${BASE_URL}/pre-download?fileId=`)){
        return this.$message.warning({
          key: 'errorTip',
          content: '请输入纬领云盘合法下载链接'
        })
      }
      // 提取链接内容
      let strArr = originalUrl.split('&');
      let Token = '';
      let DownloadUrl = '';
      let Type = '';
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
        if(arr[0] === 'type'){
          Type = arr[1];
          return false
        }
        return true
      })
      // 获取的下载链接
      let url = arr.join('&');
      if(!Token || !DownloadUrl){
        return this.$message.warning({
          key: 'errorTip',
          content: '请输入纬领云盘合法下载链接'
        })
      }
      return {
        url, Token, DownloadUrl, Type
      }
    },
    // 获取用户信息
    async getUserInfo(Token){
      return new Promise((resolve, reject) => {
        this.$http.get(`${BASE_URL}/user`, {
          headers: {
            'Token': Token
          },
          params: {
            publicKey: this.keypair.publicKey
          }
        }).then(response => {
          if(response.data.code === 200){
            resolve(response.data.data);
          }else {
            reject(response.data.msg)
          }
        })
      })
    },
    // 新建下载任务
    async addDownload(){
      // 判断当前未完成任务数量
      if(this.downloadList.filter(i => !i.hidden && i.status !== downloadStatus.decrypted).length >= 5){
        return this.$message.warning({
          key: 'downloadError',
          content: '最多存在5个下载任务，等待下载完成后再试'
        })
      }
      let originalUrl = this.originalUrl;
      let {url, Token, DownloadUrl, Type} = this.dealOriginalUrl(originalUrl);

      if(Type === 'share'){
        // 如果文件是分享文件 需要获取分享者密钥
        this.$message.loading({
          key: 'RSAUtil',
          content: '分享链接处理中……',
          duration: 0
        });
        this.loading = true;
        // 开始分配私钥公钥任务
        this.$electron.ipcRenderer.send('openNewWindow', {
          type: 'RSAUtil',
          fileObj: {id: Date.now(), url, Token, DownloadUrl, originalUrl},
        });


      }else {
        if(url){
          try {
            // 获取用户信息
            let {skey: mikey} = await this.getUserInfo(Token);
            if(isBase64(mikey)){
              mikey = atob(RSAUtil.privateKeyDecrypt(mikey, this.keypair.privateKey))
            }

            let res = await this.fetchDecryptFileInfo({
              url, Token
            })
            let {fileName, size, skey, token} = res;

            // 加密文件下载
            let path = `${this.savePath}/${fileName}.weblink`;

            let item = {
              // 下载任务ID
              id: Date.now(),
              // 云盘下载链接
              originalUrl: originalUrl,
              // 当前下载请求
              request: null,
              // 当前文件状态
              status: downloadStatus.default,
              // 当前文件下载进度
              downloadProgress: 0,
              // 解密进度
              decryptProgress: 0,
              // 保存的下载路径
              savePath: path,
              // 文件名
              fileName,
              // 文件大小
              size,
              // 用户的密钥
              mikey,
              // 密钥Hex
              skey,
              // 浏览器传来的获取文件信息的下载地址
              preDownloadUrl: url,
              // 下载地址
              DownloadUrl,
              downloadUrl: `${DownloadUrl}?token=${encodeURIComponent(token)}`,
              // 用户Token
              Token,
              // 是否隐藏
              hidden: false,
              // 定时器
              timer: null,
              // 下载速度
              speed: 0,
              // 剩余下载时间
              remainSecond: 0
            }
            // 添加到下载任务
            this.dealDownloadList(item);

            // 下载
            this.download(item, res)
          }catch (e) {
            this.$message.error(e.msg || '未知错误')
          }
        }
      }
    },
    // 下载
    async download(item, res = {}){
      try {
        // 获取下载列表的索引
        let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);
        // 获取文件信息

        if(index === -1){
          // 不存在 刚开始下载
        }else {
          // 继续下载
          res = await this.fetchDecryptFileInfo({
            url: item.preDownloadUrl, Token: item.Token
          })
        }
        let {size, token} = res;

        item.downloadUrl = `${item.DownloadUrl}?token=${encodeURIComponent(token)}`;
        // 清空之前的计算下载速度的定时器
        clearInterval(item.timer);

        this.$set(this.downloadList, index, item);
        let path = item.savePath;
        let received_bytes = 0; // 已经接收到的集结
        let total_bytes = item.size; // 总字节
        try{
          let stats = fs.statSync(path);//如果文件已存在读取文件信息
          // console.log('已存在此文件的目录信息', stats);
          if(total_bytes === stats.size){//如果文件已经存在并且已经下载按成则跳过该文件
            // 开始解密
            this.$electron.ipcRenderer.send('openNewWindow', {
              index,
              fileObj: item
            });
            return;
          }
          received_bytes = stats.size;
          // console.log('已经接收到的字节', received_bytes);
        }catch (err){
          console.log('不存在');
        }
        let params ={
          "method": 'GET',
          "url": item.downloadUrl,
          headers: {
            'Range': `bytes=${received_bytes}-`,
            'Token': item.Token,
          }
        };
        let req = request(params);
        item.request = req;
        this.$set(this.downloadList, index, item);
        let out = fs.createWriteStream(item.savePath, received_bytes === 0 ? {} : {
          start: received_bytes,
          flags: 'r+'
        });//创建文件写入

        req.pipe(out);
        req.on('response', ( response ) => {
          // console.log(response);
          // 开始定时器
          let firstBytes = received_bytes;
          item.timer = setInterval(() => {
            // console.log('定时器开始');
            let endBytes = received_bytes;
            // 下载速度
            item.speed = endBytes - firstBytes;
            // 剩余时间
            // console.log({remainSecond});
            item.remainSecond = item.speed === 0 ? 999999 : (total_bytes - endBytes) / item.speed;
            this.$set(this.downloadList, index, item);
            firstBytes = endBytes;
          }, 1000);
          this.$set(this.downloadList, index, item);
        });
        //接收到文件流事件
        req.on('data', (chunk) => {
          item.status = downloadStatus.downloading;
          item.downloadProgress = (received_bytes / size) * 100;
          this.$set(this.downloadList, index, item);
          received_bytes += chunk.length;
          // console.log({received_bytes, size}, item.downloadProgress);
        });
        //文件接收结束
        req.on('end', () => {
          // console.log(`file download complete`);
          if(received_bytes >= total_bytes){
            item.status = downloadStatus.downloaded;
            item.downloadProgress = 100;

            // 清空之前的计算下载速度的定时器
            clearInterval(item.timer);
            this.$set(this.downloadList, index, item);
            // console.log('文件内容全部完毕');
            // 开始解密
            this.$electron.ipcRenderer.send('openNewWindow', {
              index,
              fileObj: item
            });
          }
        });

        // 接收失败
        req.on('error', e=> {
          this.$message.error({
            key: 'downloadError',
            content: e.message || '文件下载失败'
          });

          item.request = null;
          item.status = downloadStatus.pause;
          // 清空之前的计算下载速度的定时器
          clearInterval(item.timer);
          this.$set(this.downloadList, index, item);
        })
      }catch (e) {
        console.error(e);
        this.$message.error(e.msg || '未知错误');
        this.cancelDownload(item)
      }
    },

    // 重新解密
    restartDecrypt(item){
      // 获取下载列表的索引
      let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);

      item.status = downloadStatus.decrypting;
      this.$set(this.downloadList, index, item);
      // 开始解密
      this.$electron.ipcRenderer.send('openNewWindow', {
        index,
        fileObj: item
      });
    },
    // 继续
    async continueDownload(item){

      this.download(item)

    },
    // 删除
    cancelDownload(item){
      // 获取下载列表的索引
      let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);
      // 当下载列表状态为下载中时 需要先暂停
      if(item.status === downloadStatus.downloading){
        this.stopDownload(item);
      }

      item.hidden = true;
      this.$set(this.downloadList, index, item);
    },
    // 暂停下载
    stopDownload(item){
      // 获取下载列表的索引
      let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);
      item.request.abort();
      // 清空之前的计算下载速度的定时器
      clearInterval(item.timer);
      item.status = downloadStatus.pause;
      item.request = null;
      this.$set(this.downloadList, index, item);
    },
    // 处理每个下载队列
    dealDownloadList(item){
      let index = this.downloadList.findIndex(i => i.originalUrl === item.originalUrl);
      if(index !== -1){
        // 存在修改
        // console.log('存在修改', );
        this.$set(this.downloadList, index, item)
      }else {
        // 不存在添加
        this.downloadList.push(item);
        // 滚动条滚动至底部
        let ele = document.getElementById('download');
        ele.scrollTop = ele.scrollHeight;
      }
    },
    // 获取（加密）文件信息
    async fetchDecryptFileInfo({url, Token}){
      return new Promise(async (resolve, reject) => {
        this.loading = true;
        let res = await this.$http.get(url, {
          headers: {
            'Token': Token
          }
        });
        this.loading = false;
        if(res.data.code === 200){
          let {fileName, size, skey, token, miKey} = res.data.data;
          size = Number(size);
          // this.originalUrl = '';
          resolve(miKey ? {fileName, size, skey, token, mikey: miKey} : {fileName, size, skey, token})
        }else {
          reject(res.data)
        }
      })
    },
    // 初始化操作
    async init(){
      let originalUrl = clipboard.readText();

      if(isBase64(originalUrl) && window.atob(originalUrl).includes(`${BASE_URL}/pre-download?fileId=`)){
        // 获取剪切板内容
        this.originalUrl = originalUrl;
      }

      // 获取保存的路径
      let data = await getDataFromDB({
        type: dbType.savePath
      });
      if(data.length === 0){
        // console.log('没有重新设置保存路径');
      }else {
        // 修改过默认路径
        this.isUpdateSavePath = true;
        this.savePath = data[0].savePath;
      }
      // 获取保存的下载列表
      let downloadData = await getDataFromDB({
        type: dbType.downloadListInfo
      });
      if(downloadData.length === 0){
        // console.log('没有保存下载列表信息');
      }else {
        this.hasDownloadList = true;
        let downList = JSON.parse(downloadData[0].downloadList) || [];

        this.downloadList = downList.filter(i => {
          // 如果关闭应用之前处于解密状态
          if(i.status === downloadStatus.decrypting){
            i.status = downloadStatus.needRestartDecrypt
            i.decryptProgress = 0
          }else if(i.status === downloadStatus.downloading){
            // 如果关闭之前处于下载状态
            i.status = downloadStatus.pause
          }
          return !i.hidden
        });
        console.log(this.downloadList);
      }
    },
    // 选择保存路径
    async selectSavePath(){
      this.$electron.remote.dialog.showOpenDialog({ properties:['openFile','openDirectory'] }, async (files) => {
        if (files) {
          if(this.isUpdateSavePath){
            // 如果修改过默认路径调用修改方法
            let data = await updateDataToDB({
              type: dbType.savePath
            }, {
              savePath: files[0]
            });
            if(data){
              this.$message.success('路径修改成功')
            }
          }else {
            // 如果尚未修改过默认路径调用新增方法
            let data = await addDataToDB({
              type: dbType.savePath,
              savePath: files[0]
            })
            if(data){
              this.$message.success('路径修改成功')
            }
          }
          this.savePath = files[0];
        }
      });
    },
    // 清空已完成记录
    delDecryptedList(){
      this.downloadList.map((item, index) => {
        if(item.status === this.downloadStatus.decrypted && !item.hidden){
          item.hidden = true;
          this.$set(this.downloadList, index, item);
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
#download{
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 10px;
  border-bottom: 1px solid #dccee7;
  border-left: 1px solid #dccee7;
  border-right: 1px solid #dccee7;
  >.file-save-path{
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  >.download-box{
    margin-top: 20px;
  }

  .download-list{
    >.action{
      display: flex;
      justify-content: flex-end;
      >.delete{
        color: #ff5542;
        cursor: pointer;
        font-size: 12px;
        margin-bottom: 10px;
      }
    }
    >.item{
      >.middle{
        padding: 10px;
        border-bottom: 1px solid #f1f1f1;
        >.fileName{
          display: flex;
          justify-content: space-between;
          >.left{
            font-weight: bold;
            color: #1890ff;
            cursor: pointer;
            &:hover{
              text-decoration: underline;
            }
          }
          >.right{
            font-size: 12px;
            color: #bbb9b9;
          }
        }
        >.status-box{
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          >.left{
            font-weight: bold;
            >.speed,.remainSecond{
              font-size: 12px;
              font-weight: normal;
              margin-left: 20px;
              color: #9a9a9a;
            }
            .remainSecond{
              color: #faad14;
            }
          }
          >.right{

          }
        }
        >.path{
          font-size: 12px;
          color: #bbb9b9;
          cursor: pointer;
          &:hover{
            text-decoration: underline;
          }
        }
      }
    }
  }
}
</style>
