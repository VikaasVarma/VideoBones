import './styles/reset.scss'
import { createApp } from 'vue'
import App from './App.vue'
import Recording from './Recording.vue'
import OnOpenPage from './pages/OnOpenPage.vue'
import CreateNewProjectPage from './pages/CreateNewProjectPage.vue'

createApp(CreateNewProjectPage).mount('#app')
