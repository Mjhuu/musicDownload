<template>
    <section class="music-box" :style="background">
        <ul class="ul">
            <li :class="['animated', h1Animate ? 'lightSpeedIn' : '']">
                <img :src="title" alt="">
            </li>
            <li>
                <a-input
                        style="width: 60%;text-align: center;opacity: .9;"
                        allowClear
                        placeholder="航哥里面请"
                        size="large"
                        v-model="id"
                        @pressEnter="getMusic"
                        clearable>
                </a-input>
            </li>
            <li v-if="downloading">
                <a-progress style="opacity: .9;" :strokeColor="{
                '0%': '#108ee9',
                '100%': '#87d068',
                }" :percent="Math.ceil(progress)" status="active">
                    <template v-slot:format="percent">
                        <span style="color: white">{{percent}}%</span>
                    </template>
                </a-progress>
            </li>
            <li style="margin-top: 10px;">
                <a-button size="large" :disabled="disabled" @click="getMusic" style="color: #466cb3;opacity: .9;">下载网易云音乐</a-button>
<!--                <a-button @click="changeBg" size="large">切换壁纸</a-button>-->
            </li>
        </ul>
    </section>
</template>

<script>
    import request from 'request'
    import * as fs from 'fs'
    import * as url from 'url'
    import {getSongDetail} from "../../Api";
    import logo from "../assets/logo.png";
    import bg from "../assets/bg.jpg";
    import bg1 from "../assets/bg1.jpg";
    import bg2 from "../assets/bg2.jpg";
    import title from "../assets/title.png";
    import {getRandomIntInclusive} from "../common";
    const keyList = {
      one: 'one',
      two: 'two',
      three: 'three',
    };

    export default {
        name: "Music",
        data(){
            return{
                title,
                id: '',
                disabled: false,
                progress: 0,
                downloading: false,

                online: true,
                h1Animate: false,

                backgroundList: [
                    {
                        background: `url(${bg}) center center / cover no-repeat`
                    },
                    {
                        background: `url(${bg1}) center center / cover no-repeat`
                    },
                    {
                        background: `url(${bg2}) center center / cover no-repeat`
                    },
                ],
                background:  {
                    background: `url(${bg1}) center center / cover no-repeat`
                }
            }
        },
        mounted() {
            setTimeout(() =>{
                this.h1Animate = true;
            }, 500);
            // 检查网络状态
            if(this.checkOnline()){
                this.online = true;
                // this.dealOnline();
            }else {
                this.deaLOffline();
            }
            // 监听网络变化
            window.addEventListener('online', () =>{
                this.dealOnline();
            });
            window.addEventListener('offline',() => {
                this.deaLOffline();
            });
        },
        methods:{
            changeBg(){
              let num = getRandomIntInclusive(0, this.backgroundList.length-1);
              this.background = this.backgroundList[num]
            },
            async getMusic(){
                let {id, online} = this;
                if(isNaN(parseInt(id))){
                    let reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
                    let dealArr = reg.exec(id);
                    if(!dealArr){
                        return this.$message.warning({
                            key: keyList.one,
                            content: '航哥，你输入的不合法。'
                        });
                    }
                    let obj = url.parse(dealArr[0]);
                    if(obj.query){
                        let arr = obj.query.split('&');
                        let dealObj = {};
                        arr.forEach(item =>{
                            item = item.split('=');
                            dealObj[item[0]] = item[1];
                        });
                        if(dealObj.id){
                            id = dealObj.id;
                        }else {
                            let arr = obj.pathname.split('/');
                            let newId = arr[2];
                            if(!isNaN(parseInt(newId))){
                                id = newId
                            }
                        }
                    }
                }
                if(!online){
                    return this.$message.warning({
                        key: keyList.two,
                        content: '网络已断开，请检查网络设置，连接网络后方可使用下载功能。'
                    });
                }
                if(!id || id.length < 3){
                    return this.$message.warning({
                        key: keyList.three,
                        content: '航哥，你输入的网易云ID可能不对。'
                    });
                }
                let params ={
                    "method": 'GET',
                    "url": `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
                };
                const hide = this.$message.loading('音乐资源请求中……航哥耐心等待即可', 0);
                this.disabled = true;
                this.progress = 0;
                let req = request(params);
                setTimeout(hide, 0);
                this.disabled = false;
                req.on('response', async ( response ) => {
                    // console.log({href: req['href']});
                    if(req['href'] === 'https://music.163.com/404'){
                        return this.$message.warning({
                            key: keyList.three,
                            content: '航哥，你输入的网易云ID可能不对。'
                        });
                    }
                    let data = await getSongDetail({
                       ids: id
                    });
                    if(data.code === 200){
                        let songName = data.songs[0].name;
                        this.downLoadMusic(req['href'], songName);
                    }else {
                        this.downLoadMusic(req['href'], id);
                    }
                });
            },
            downLoadMusic(url, fileName){
                this.$electron.remote.dialog.showOpenDialog({ properties:['openFile','openDirectory'] }, (files) => {
                    if(files){
                        this.downloading = true;
                        let path = files[0] + `/${fileName}.mp3`;
                        let received_bytes = 0;//已经接收到的集结 136635866
                        let allBytes = 0;
                        let req = request(url);
                        let stream = fs.createWriteStream(path);
                        req.pipe(stream);
                        req.on('response', ( response ) => {
                            // console.log(response.headers['content-type']);
                            // console.log('content-length');
                            // console.log(response.headers['content-length']);
                            allBytes = response.headers['content-length'];
                        });
                        //接收到文件流事件
                        req.on('data', (chunk) => {
                            received_bytes += chunk.length;
                            this.progress = (received_bytes / allBytes) * 100;

                            // console.log(this.progress);
                        });
                        //文件接收结束
                        req.on('end', () => {
                            this.$message.success('航哥，网易云音乐已成功下载到你选择的目录。');
                            this.id = '';
                            this.downloading = false;
                        });
                    }else {
                        this.$message.warning('航哥，你尚未选择下载目录。');
                    }
                });
            },

            dealOnline(){
                this.online = true;
                this.systemTip({
                    body: '网络已连接，欢迎使用航哥专属网易云音乐'
                });
            },
            deaLOffline(){
                this.online = false;
                this.systemTip({
                    body: '网络已断开，请检查网络设置，连接网络后方可使用下载功能'
                })
            },
            systemTip({title = '系统提示', body = '未知提示'}){
                const option = {
                    title,
                    body,
                    icon: logo
                };
                let myNotification = new window.Notification(option.title, option);
            },
            checkOnline() {
                return window.navigator.onLine
            }
        }
    }
</script>

<style lang="scss" scoped>
    .music-box{
        position: relative;
        padding: 20px;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        flex-wrap: wrap;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    ul.ul{
        padding: 0;
        margin: -60px 0 0 0;
        width: 100%;
        list-style: none;
        >li{
            width: 100%;
            display: flex;
            line-height: 50px;
            align-items: center;
            justify-content: center;
            padding: 0 30px;
            margin-bottom: 30px;
            img{
                height: 100px;
                transform: scale(1.1);
            }
        }
    }
</style>
