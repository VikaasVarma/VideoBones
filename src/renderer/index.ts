import './styles/reset.scss';
import { createApp } from 'vue';

import App from './pages/App.vue';
import OnOpenPage from './pages/OnOpenPage.vue';
import Recording from './Recording.vue';

import CreateNewProjectPage from './pages/CreateNewProjectPage.vue';
import SingleVideoEditorPage from './pages/SingleVideoEditorPage.vue';
import VideoEditorPage from './pages/VideoEditorPage.vue';

const app = createApp(App);

app.mount('#app');

createApp(App).mount('#app');
