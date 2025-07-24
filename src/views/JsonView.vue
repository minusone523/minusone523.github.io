<template>

    <a-textarea v-model:value="json.str" placeholder="Basic usage" :rows="8" />
    <br />
    <br />
  
    <div>
      <vue-json-pretty :data='JSON.parse(json.str)' />
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import VueJsonPretty from 'vue-json-pretty';
  import 'vue-json-pretty/lib/styles.css';
  
  export default {
    components: {
      VueJsonPretty,
    },
    data() {
      return {
        json: {
          str: '{"message": "please input", "list": [1,2,3], "dict": {"x":1, "y":2}}'
        }
      }
    },
  };
  </script>