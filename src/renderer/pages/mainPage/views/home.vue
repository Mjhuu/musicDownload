<template>
    <div class="box">
        <!--<span>我是首页</span>
        <a-button type="primary" @click="showModal">Open Modal with async logic</a-button>
        <a-modal
                title="Title"
                :visible="visible"
                @ok="handleOk"
                :confirmLoading="confirmLoading"
                @cancel="handleCancel"
        >
            <p>{{ModalText}}</p>
        </a-modal>
        <a-button @click="sendMsg">发送数据</a-button>
        <a-dropdown :trigger="['contextmenu']">
            <span style="user-select: none">Right Click on Me</span>
            <a-menu slot="overlay">
                <a-menu-item key="1">1st menu item</a-menu-item>
                <a-menu-item key="2">2nd menu item</a-menu-item>
                <a-menu-item key="3">3rd menu item</a-menu-item>
            </a-menu>
        </a-dropdown>
        <a-button @click="addData">增加</a-button>
        <a-button @click="getData">获取</a-button>
        <a-button @click="reviseData">修改</a-button>
        <a-button @click="delData">删除</a-button>-->
        <!--<input type="file" @change="e => selectFile(e)">
        <a-progress :percent="percent" status="active" />
        <a-button @click="uploadFile">上传</a-button>
        <a-button @click="stopUpload">暂停上传</a-button>
        <a-button @click="continueUpload">继续上传</a-button>
        <br>
        <a-button @click="downloadFile">下载</a-button>
        <a-button @click="stopDownload">暂停下载</a-button>
        <a-button @click="continueDownload">继续下载</a-button>
        <br>
        <a-button @click="fileSelect">选择文件</a-button>
        -->
        <Music />
    </div>
</template>

<script>
    import * as fs from 'fs'
    import * as path from 'path'
    import SparkMD5 from 'spark-md5'
    import request from 'request'
    import axios from 'axios'
    import Music from "../components/Music";
    const blobSlice = File.prototype.slice;

    export default {
        name: "home",
        data(){
          return{
              ModalText: 'Content of the modal',
              visible: false,
              confirmLoading: false,
              chunkSize: 5 * 1024 * 1024, // 每个chunk的大小，设置为2兆
              file: null,
              allChunksArr: [],
              uploadedChunksArr: [],
              axiosPromiseArray: [],
              cancelAxios: [],
              percent: 0,
              response: null
          }
        },
        components:{
            Music
        },
        mounted() {
            /*fs.readFile(path.join(__dirname, './news.vue'), function (err, data) {
                if(err){
                    console.log(err);
                    return
                }
                console.log(data.toString());
            })*/
        },
        methods:{
            fileSelect(){
                this.$electron.remote.dialog.showOpenDialog({

                    properties:['openFile']

                },function(dir){

                    if(dir){
                        let path = dir[0];
                        let stats = fs.statSync(path);//读取文件信息
                        console.log(stats);
                    }
                })
            },
            hashFile(file){
                const {chunkSize} = this;
                return new Promise((resolve, reject) => {
                    const chunks = Math.ceil(file.size / chunkSize); // 最大分片数
                    let currentChunk = 0;
                    const spark = new SparkMD5.ArrayBuffer();
                    const fileReader = new FileReader();
                    function loadNext() {
                        const start = currentChunk * chunkSize;
                        const end = Math.min(file.size, start + chunkSize);

                        console.log(blobSlice.call(file, start, end));
                        console.log({start, end});
                        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
                    }
                    loadNext();
                    fileReader.onload = e => {
                        spark.append(e.target.result); // Append array buffer
                        currentChunk += 1;
                        if (currentChunk < chunks) {
                            loadNext();
                            console.log(`第${currentChunk}分片解析完成，开始解析${currentChunk + 1}分片`);
                        } else {
                            console.log('finished loading');
                            const result = spark.end();
                            // 如果单纯的使用result 作为hash值的时候, 如果文件内容相同，而名称不同的时候
                            // 想保留两个文件无法保留。所以把文件名称加上。
                            const sparkMd5 = new SparkMD5();
                            sparkMd5.append(result);
                            sparkMd5.append(file.name);
                            console.log(file.name);
                            const hexHash = sparkMd5.end();
                            console.log(hexHash);
                            resolve(hexHash);
                        }
                    };
                    fileReader.onerror = () => {
                        console.warn('文件读取失败！');
                    };
                }).catch(err => {
                    console.log(err);
                });
            },
            async selectFile(e){
                let file = e.target.files[0];
                this.file = file;
            },
            async uploadFile(){
                this.axiosPromiseArray = [];
                this.uploadedChunksArr = [];
                let {file, chunkSize} = this;
                const CancelToken = axios.CancelToken;
                let self = this;
                if (!file) {
                    let pathObj = await this.getData({_id: 'kvW99vNSor9RDtDs'});
                    if(pathObj.length === 0){
                        return this.$message.warning('请选择上传文件');
                    }
                    let path = pathObj[0].uploadFile;
                    let stats = fs.statSync(path);//读取文件信息
                    let pathName = path.slice(path.lastIndexOf('\\') + 1);
                    console.log(stats);
                    console.log(path);
                    console.log(pathName);
                    let size = stats.size;//文件大小
                    let chunks = Math.ceil(size / chunkSize);//总共的分片数
                    // 23a7123b845f3db9b8191dd838ff014b
                    // 642c075b332c08a8d562c3be1b08a5d5
                    console.log(chunks);
                    const fileReader = new FileReader();
                    let blobArr = [];
                    let currentChunk = 0;
                    let newBlobChunk = 0;
                    const spark = new SparkMD5.ArrayBuffer();
                    for(let i = 0; i< chunks; i++){
                        let end = Math.min(size, (i + 1) * chunkSize);
                        let arr = [];
                        console.log({start: i * chunkSize, end});
                        let readStream = fs.createReadStream(path, { start: i * chunkSize, end: end - 1});
                        //on data读取数据
                        readStream.on('data', (data)=>{
                            arr.push(data)
                        });
                        //on end在该分片读取完成时触发
                        readStream.on('end', ()=>{
                            let blob = new Blob(arr);
                            // console.log(Buffer.concat(arr));
                            currentChunk++;
                            // console.log(currentChunk);
                            // console.log(i);
                            // console.log(blob);
                            blobArr.push({
                                key: i, blob
                            });
                            if(currentChunk >= chunks){
                                loaded(blobArr)
                            }
                        });
                    }
                    let newBlob = [];
                    function loaded(blobArr = []){
                        console.log('加载完毕');
                        for(let i=0; i< chunks; i++){
                            blobArr.forEach(item =>{
                                if(item.key === i){
                                    newBlob.push(item.blob)
                                }
                            });
                        }
                        loadNext();
                    }
                    function loadNext() {
                        console.log(newBlob[newBlobChunk]);
                        fileReader.readAsArrayBuffer(newBlob[newBlobChunk]);
                    }
                    fileReader.onload = e => {
                        // console.log(e.target.result);
                        spark.append(e.target.result); // Append array buffer
                        newBlobChunk += 1;
                        if (newBlobChunk < chunks) {
                            loadNext();
                            console.log(`第${newBlobChunk}分片解析完成，开始解析${newBlobChunk + 1}分片`);
                        } else {
                            console.log('finished loading');
                            const result = spark.end();
                            const sparkMd5 = new SparkMD5();
                            sparkMd5.append(result);
                            sparkMd5.append(pathName);
                            const hash = sparkMd5.end();
                            console.log(hash);
                            this.allChunksArr = [];
                            for (let i = 0; i < chunks; i++) {
                                const uploadHash = `${hash}-${i}`;
                                this.allChunksArr.push(uploadHash);
                                // 构建表单
                                const form = new FormData();
                                form.append('file', newBlob[i]);
                                form.append('name', pathName);
                                form.append('total', chunks);
                                form.append('index', i);
                                form.append('size', size);
                                form.append('hash', hash);
                                const options = {
                                    onUploadProgress: progressEvent => {
                                        // 处理上传的进度
                                        // console.log(blockCount, i, progressEvent, file);
                                        let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
// eslint-disable-next-line no-console
                                        console.log(i, complete);
                                    },
                                };
                                // 加入到 Promise 数组中
                                this.axiosPromiseArray.push(axios.post(`http://localhost:3001/file/upload?hash=${hash}&index=${i}`, form, options).then(res => {
                                    this.uploadedChunksArr.push(res.data.result.chunksPath);
                                    console.log(res.data.result.chunksPath);
                                }));
                            }
                            console.log(this.axiosPromiseArray);
                            axios.all(this.axiosPromiseArray).then(() => {
                                // 合并chunks
                                const data = {
                                    size,
                                    name: pathName,
                                    total: chunks,
                                    hash
                                };
                                axios.post('http://localhost:3001/file/merge_chunks', data).then(res => {
                                    this.$message.success('上传成功');
                                    console.log(res.data.result.url, /*file*/);
                                }).catch(err => {
                                    console.log(err);
                                });
                            });
                        }
                    };
                    return
                }
                // this.addData({uploadFile: file.path});
                this.allChunksArr = [];
                const blockCount = Math.ceil(file.size / chunkSize); // 分片总数
                const hash = await this.hashFile(file); //文件 hash
                // 获取文件hash之后，如果需要做断点续传，可以根据hash值去后台进行校验。
                // 看看是否已经上传过该文件，并且是否已经传送完成以及已经上传的切片。
                for (let i = 0; i < blockCount; i++) {
                    const uploadHash = `${hash}-${i}`;
                    this.allChunksArr.push(uploadHash);
                    const start = i * chunkSize;
                    const end = Math.min(file.size, start + chunkSize);
                    let cancel;
                    // 构建表单
                    const form = new FormData();
                    form.append('file', blobSlice.call(file, start, end));
                    form.append('name', file.name);
                    form.append('total', blockCount);
                    form.append('index', i);
                    form.append('size', file.size);
                    form.append('hash', hash);
                    // ajax提交 分片，此时 content-type 为 multipart/form-data
                    const options = {
                        onUploadProgress: progressEvent => {
                            // 处理上传的进度
                            // console.log(blockCount, i, progressEvent, file);
                            let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
// eslint-disable-next-line no-console
                            console.log(i, complete);
                        },
                        cancelToken: new CancelToken(function executor(c) {
                            cancel = c;
                            self.cancelAxios.push(cancel)
                        })
                    };
                    // 加入到 Promise 数组中
                    this.axiosPromiseArray.push(axios.post(`http://localhost:3001/file/upload?hash=${hash}&index=${i}`, form, options).then(res =>{
                        this.uploadedChunksArr.push(res.data.result.chunksPath);
                        console.log(res.data.result.chunksPath);
                    }));
                }
                // 所有分片上传后，请求合并分片文件
                await axios.all(this.axiosPromiseArray).then(() => {
                    // 合并chunks
                    const data = {
                        size: file.size,
                        name: file.name,
                        total: blockCount,
                        hash
                    };
                    axios.post('http://localhost:3001/file/merge_chunks', data).then(res => {
                        this.$message.success('上传成功');
                        console.log(res.data.result.url, /*file*/);
                    }).catch(err => {
                        console.log(err);
                    });
                });
            },
            stopUpload(){
                // console.log(this.uploadedChunksArr);
                // console.log(this.allChunksArr);
                // 暂停之后尚未上传的片段
                let filterArr = this.getArrDifference(this.allChunksArr, this.uploadedChunksArr) || [];
                let arr = filterArr.map(i => {
                    i = i.split('-');
                    return i[1]
                });
                arr.forEach((i, key) =>{
                    i = Number(i);
                    this.cancelAxios[i]();
                })
            },
            continueUpload(){
                this.uploadFile()
            },
            /*http://localhost:3001/uploads/01-%E6%B5%8F%E8%A7%88%E5%99%A8%E5%8E%9F%E7%90%86%E4%B8%8E%E7%BD%91%E9%A1%B5%E7%9A%84%E5%9F%BA%E6%9C%AC%E7%BB%93%E6%9E%84.mp4*/
            downloadFile(){
                this.$electron.remote.dialog.showOpenDialog({ properties:['openFile','openDirectory'] }, (files) => {
                    let path = files[0] + '/a.mp4';
                    let received_bytes = 0;//已经接收到的集结 136635866
                    let total_bytes = 136635866;//总字节
                    console.log(path);
                    try{
                        let stats = fs.statSync(path);//如果文件已存在读取文件信息
                        if(total_bytes === stats.size){//如果文件已经存在并且已经下载按成则跳过该文件
                            return;
                        }
                        received_bytes = stats.size;
                        console.log(received_bytes);
                    }catch (err){
                        console.log('不存在');
                    }
                    let params ={
                        "method": 'GET',
                        "url": 'http://localhost:3001/uploads/01-%E6%B5%8F%E8%A7%88%E5%99%A8%E5%8E%9F%E7%90%86%E4%B8%8E%E7%BD%91%E9%A1%B5%E7%9A%84%E5%9F%BA%E6%9C%AC%E7%BB%93%E6%9E%84.mp4',
                        headers: {
                            'Range': 'bytes='+received_bytes
                        }
                    };
                    let req = request(params);
                    let out = fs.createWriteStream(path);//创建文件写入
                    req.pipe(out);
                    req.on('response', ( response ) => {
                        console.log(response);
                        console.log(response.headers['content-type']);
                        console.log('content-length');
                        console.log(response.headers['content-length']);
                        let startTime = new Date().getTime();
                        console.log({startTime});
                        this.response = response;
                    });
                    //接收到文件流事件
                    req.on('data', (chunk) => {
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
                })
            },
            stopDownload(){
                this.response.socket.end(); // or res.socket.destroy();
                console.log('停止了');
            },
            continueDownload(){
                this.downloadFile()
            },
            getArrDifference(arr1, arr2) {
                return arr1.concat(arr2).filter(function(v, i, arr) {
                    return arr.indexOf(v) === arr.lastIndexOf(v);
                });
            },
            addData(data){
                this.$db.insert(data,function(err, doc){
                    if(err){
                        return err
                    }
                    console.log(doc);
                })
            },
            getData(data){
                return new Promise((resolve, reject) => {
                    this.$db.find(data,function(err, doc){
                        //获取查询的数据
                        if(err){
                            return reject(err)
                        }
                        resolve(doc);
                    })
                })
            },
            reviseData(data, set = {$set:{name: 'Mjhu'}}){
                this.$db.update(data, set,function(err, doc){
                    if(err){
                        return err
                    }
                    console.log(doc);
                })
            },
            delData(data){
                this.$db.remove(data,{},function(err, doc){
                    if(err){
                        return err
                    }
                    console.log(doc);
                })
            },
            sendMsg(){
                this.$message.info('This is a normal message');
                this.$electron.ipcRenderer.send('toMain', '你好a')
            },
            showModal() {
                this.visible = true;
            },
            handleOk(e) {
                this.ModalText = 'The modal will be closed after two seconds';
                this.confirmLoading = true;
                setTimeout(() => {
                    this.visible = false;
                    this.confirmLoading = false;
                }, 2000);
            },
            handleCancel(e) {
                console.log('Clicked cancel button');
                this.visible = false;
            },
        }
    }
</script>

<style scoped lang="scss">
.box{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
}
</style>
