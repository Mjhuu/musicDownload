<template>
    <header>
        <a-button-group style="-webkit-app-region: no-drag;">
            <a-button style="background-color: transparent;color: white;" @click="min" icon="minus" />
            <a-button style="background-color: transparent;color: white;" @click="max" icon="border" />
            <a-button style="background-color: transparent;color: white;" @click="close" icon="close" />
        </a-button-group>
        <!--弹出框-->
        <a-modal :closable="false" :width="360" v-model="closeState" :footer="null">
            <div class="close-top">
                <div class="left">
                    <a-icon style="color: #faad14;font-size: 25px;" type="question-circle" />
                </div>
                <div class="right">
                    <h3>退出应用？</h3>
                    <p>确定直接退出应用吗？</p>
                    <a-checkbox style="margin-bottom: 1rem;" @change="checkChange" :checked="remember">记住我的操作，下次不再提醒。</a-checkbox>
                </div>
            </div>
            <div class="close-bottom">
                <a-button key="back" @click="hideApp">最小化至托盘</a-button>
                <a-button key="submit" type="danger" @click="quitApp">
                    退出应用
                </a-button>
            </div>
        </a-modal>
    </header>
</template>

<script>
    export default {
        name: "Header",
        data(){
            return{
                closeState: false,
                remember: false
            }
        },
        mounted() {
            // this.delData({
            //     id: 'rememberClose',
            // })
        },
        methods: {
            checkChange(v){
                console.log(v.target.checked);
                this.remember = v.target.checked;
            },
            min(){
                console.log('min');
                this.$electron.ipcRenderer.send('window-min')
            },
            hide(){
                console.log('hide');
                this.$electron.ipcRenderer.send('window-hide')
            },
            max(){
                console.log('max');
                this.$electron.ipcRenderer.send('window-max')
            },
            async hideApp(){
                console.log(this.remember);
                if(this.remember){
                    let data = await this.getData({
                        id: 'rememberClose',
                    });
                    if(data.length === 0){
                        await this.addData({
                            id: 'rememberClose',
                            state: 'hide'
                        });
                    }else {
                        if(data[0].state !== 'hide'){
                            await this.reviseData({
                                id: 'rememberClose',
                            }, {$set:{state: 'hide'}});
                        }
                    }
                }
                this.closeState = false;
                setTimeout(() =>{
                    this.hide();
                }, 350);
            },
            async quitApp(){
                console.log(this.remember);
                if(this.remember){
                    let data = await this.getData({
                        id: 'rememberClose',
                    });
                    if(data.length === 0){
                        await this.addData({
                            id: 'rememberClose',
                            state: 'quit'
                        });
                    }else {
                        if(data[0].state !== 'quit'){
                            await this.reviseData({
                                id: 'rememberClose',
                            }, {$set:{state: 'quit'}});
                        }
                    }
                }
                console.log('close');
                this.$electron.ipcRenderer.send('window-close')
            },
            async close(){
                let data = await this.getData({
                    id: 'rememberClose',
                });
                if(data.length === 0){
                    this.closeState = true;
                }else {
                    let state = data[0].state;
                    if(state === 'hide'){
                        this.hide();
                    }else if(state === 'quit'){
                        this.$electron.ipcRenderer.send('window-close')
                    }else {
                        this.closeState = true;
                    }
                }
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
        }
    }
</script>

<style scoped lang="scss">
    .close-top{
        display: flex;
        >.left{
            margin-right: 10px;
        }
        >.right{
            h3{
                display: block;
                overflow: hidden;
                color: rgba(0,0,0,.85);
                font-weight: 500;
                font-size: 16px;
                line-height: 1.4;
            }
            p{
                margin-top: 8px;
                color: rgba(0,0,0,.65);
                font-size: 14px;
            }
        }
    }
    .close-bottom{
        width: 100%;
        display: flex;
        justify-content: flex-end;
        button{
            margin-left: 3px;
        }
    }
    header{
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 40px;
        background-image: linear-gradient(141deg, #dccee7 0%, #dcbfdd 51%, #b9aed6 75%);
        z-index: 999;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        -webkit-app-region: drag;
        padding: 5px 10px;
    }
</style>
