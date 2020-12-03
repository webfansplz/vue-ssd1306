<template>
  <text x="0" y="0">Hello Vue</text>
  <text x="0" y="20">{{ time }}</text>
  <text x="0" y="40">Hi SSD3306</text>
</template>
<script>
import { defineComponent, ref, toRefs, onMounted } from "vue";
import dayjs from "dayjs";
export default defineComponent({
  setup() {
    const time = ref(dayjs().format("hh:mm:ss"));

    onMounted(() => {
      setInterval(() => {
        time.value = dayjs().format("hh:mm:ss");
      }, 800);
    });
    return {
      ...toRefs({
        time,
      }),
    };
  },
});
</script>
