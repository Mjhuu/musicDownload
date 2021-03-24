import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: require('@/views/news').default
    },
    {
      path: '/news',
      component: require('@/views/home').default
    },
    {
      path: '/newWindow',
      component: require('@/views/newWindow').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
