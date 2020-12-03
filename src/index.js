import { createApp } from "./renderer.js";
import { getContainer } from "./adapter";
import { oledService } from "./oled";
import App from "./App.vue";
const oledIns = oledService();
oledIns.init().then(() => {
  createApp(App).mount(getContainer(oledIns));
});
