<template>
  <div>
    <a-textarea
      v-model:value="jsonStr"
      placeholder="输入 JSON 字符串"
      :rows="8"
    />
    <br /><br />

    <div v-if="error" style="color: red; white-space: pre-wrap;">
      ❌ JSON 解析出错：{{ error }}
    </div>

    <div v-else>
      <vue-json-pretty :data="parsed" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
// jsonlint-mod gives you line/column info in its error messages
import { parse } from 'jsonlint-mod'

const jsonStr = ref(
  '{"message": "please input", "list": [1,2,3], "dict": {"x":1, "y":2}}'
)
const parsed = ref(null)
const error  = ref('')

watch(
  jsonStr,
  (newVal) => {
    try {
      // use jsonlint-mod to get detailed error context
      parsed.value = parse(newVal)
      error.value  = ''
    } catch (e) {
      parsed.value = null
      // e.message will include line/column pointers
      error.value  = e.message
    }
  },
  { immediate: true }
)
</script>
