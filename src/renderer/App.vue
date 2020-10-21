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
  import logo from './assets/logo.png'

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
    },
  }
</script>

<style lang="scss">
  @import "./common/animate.min.css";

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
