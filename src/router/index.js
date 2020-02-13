import Vue from 'vue'
import VueRouter from 'vue-router'
import PCAN from './../views/Pcan.vue'
import HOME from './../views/Home.vue'
import SHE from './../views/SHE.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HOME
  },
  {
    path: '/pcan',
    name: 'pcan',
    component: PCAN
  },
  {
    path: '/security',
    name: 'security',
    component: SHE
  }
]

const router = new VueRouter({
  routes
})

export default router
