import './styles/reset.scss';

import App from './pages/App.vue';
import { createApp } from 'vue';

import { generateMetronome } from './util/metronome';

const app = createApp(App);

app.mount('#app');

generateMetronome({ bpm: 120, length: 10 });
