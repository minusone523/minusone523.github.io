<template>
 
    <div>
      <ul class="input_list">
        <li>时间戳：<a-input v-model:value="time.timestamp"></a-input>
        &nbsp;&nbsp;单位：
            <a-radio-group v-model:value="time.unit">
              <a-radio value="1">秒</a-radio>
              <a-radio value="1000">毫秒</a-radio>
            </a-radio-group>
           : {{ timestr }}
        </li>
      </ul>
  
    </div>
  </template>
  
  <script>
  import { defineComponent } from "vue";
  import moment from 'moment';
  const dateFormat = "YYYY-MM-DD";
  export default defineComponent({
    data() {
      return {
        time: {
          timestamp: (new Date()).getTime(),
          unit: 1000,
          timestr: "1970-01-01 00:00:00"
        }
      };
    },
    computed: {
      timestr() {
        return moment(parseInt(this.time.timestamp / parseInt(this.time.unit) * 1000)).local().format("YYYY-MM-DD HH:mm:ss");
      }
    },
  });
  </script>
  
  <style lang="scss">
  ul {
    list-style: none;
  }
  
  .input_list {
    padding: 10px;
    li {
      margin-bottom: 15px;
      & > input {
        width: 400px !important;
      }
    }
  }
  </style>
  