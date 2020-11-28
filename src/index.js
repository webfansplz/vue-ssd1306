// import { createApp } from "vue";
import { createApp } from "./renderer.js";
import { getContainer } from "./container";
import App from "./App.js";
createApp(App).mount(getContainer());
