import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import ItemListView from '../views/ItemListView.vue'
import PublishView from '../views/PublishView.vue'
import ItemDetailView from '../views/ItemDetailView.vue'
import ChatView from '../views/ChatView.vue'
import ChatsView from '../views/ChatsView.vue'
import MapView from '../views/MapView.vue'
import WishlistView from '../views/WishlistView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import ProfileView from '../views/ProfileView.vue'
import EditItemView from '../views/EditItemView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/auth', name: 'auth', component: AuthView },
    { path: '/items', name: 'items', component: ItemListView },
    { path: '/items/:id', name: 'itemDetail', component: ItemDetailView, props: true },
    { path: '/publish', name: 'publish', component: PublishView },
    { path: '/chats', name: 'chats', component: ChatsView },
    { path: '/chat/:userId', name: 'chat', component: ChatView, props: true },
    { path: '/map', name: 'map', component: MapView },
    { path: '/wishlist', name: 'wishlist', component: WishlistView },
    { path: '/notifications', name: 'notifications', component: NotificationsView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/profile/:userId?', name: 'profile', component: ProfileView },
    { path: '/items/:id/edit', name: 'editItem', component: EditItemView, props: true },
  ]
})

export default router
