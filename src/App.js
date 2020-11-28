import {
  defineComponent,
  h,
  ref,
  toRefs,
  onMounted,
  onUnmounted,
} from "@vue/runtime-core";
const App = defineComponent({
  setup() {
    const title = ref(Date.now());
    onMounted(() => {
      setInterval(() => {
        title.value = Date.now();
      }, 2000);
    });

    onUnmounted(() => {});

    return {
      ...toRefs({
        x: 100,
        y: 200,
        title,
      }),
    };
  },
  render(ctx) {
    return h("container", [
      h("text", { x: ctx.x, y: ctx.y, title: ctx.title }, ctx.title),
      h("pixel", { x: ctx.x, y: ctx.y, title: ctx.title }, ctx.title),
    ]);
  },
});
export default App;
