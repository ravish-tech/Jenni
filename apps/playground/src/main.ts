import { createApp } from 'vue';
import 'jenni-core/css';
import './styles/playground.css';
import App from './App.vue';
import { startPrefs } from './lib/prefs';
import { startFeedbackSync } from './lib/feedback';

startPrefs();
startFeedbackSync();
createApp(App).mount('#app');
