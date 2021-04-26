import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: () => import('./../views/download/download')
    },
    {
      path: '/news',
      component: () => import('./../views/home')
    },
    {
      path: '/newWindow',
      component: () => import('./../views/newWindow')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
