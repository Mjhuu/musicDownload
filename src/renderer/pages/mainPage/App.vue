<template>
  <div id="app">
    <Header></Header>
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Header from "./components/Header";
import {remote} from "electron";

export default {
  name: 'my-project',
  components:{
    Header
  },
  mounted() {
    // 首次加载完成后移除动画
    let loadDOM = document.querySelector('#appLoading');
    if (loadDOM) {
      const animationendFunc = function() {
        loadDOM.removeEventListener('animationend', animationendFunc);
        loadDOM.removeEventListener('webkitAnimationEnd', animationendFunc);
        document.body.removeChild(loadDOM);
        loadDOM = null;
      }.bind(this);
      loadDOM.addEventListener('animationend', animationendFunc);
      loadDOM.addEventListener('webkitAnimationEnd', animationendFunc);
      loadDOM.classList.add('removeAnimate')
    }
    // 向服务端发起客户端已打开的请求
    let obj = {};
    remote.process.argv.map((i) => {
      if(i.toLowerCase().includes('weblinkcloudprotocol:')){
        let infoArr = i.split(':');
        if(infoArr[1]){
          let argv = infoArr[1].split(';')
          argv.map(j => {
            let jArr = j.split('=')
            obj[jArr[0]] = jArr[1]
          })
        }
      }
    })
    if(JSON.stringify(obj) !== '{}'){
      let {clientStatusId, token, clientStatusUrl} = obj;
      this.$http.put(`http://192.168.0.118:8081/client-status`, {}, {
        headers: {
          'Token': token
        }
      }).then(response => {
        if(response.data.code === 200){
          // alert('状态修改成功')
        }else {
          // alert('状态修改失败')
        }
      })
    }

  },
}
</script>

<style lang="scss">
@import "./common/animate.min.css";
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{width:6px;background:rgba(16,31,28,.1);-webkit-border-radius:2em;-moz-border-radius:2em;border-radius:2em}::-webkit-scrollbar-thumb{background-color:rgba(16,31,28,.5);background-clip:padding-box;min-height:28px;-webkit-border-radius:2em;-moz-border-radius:2em;border-radius:2em}::-webkit-scrollbar-thumb:hover{background-color:#101f1c}
#app{
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  >.content{
    padding-top: 40px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    >ul{
      width: 100%;
      list-style: none;
      height: 40px;
      background-color: #2d2d2d;
    }
  }

}
</style>
