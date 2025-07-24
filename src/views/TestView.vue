<template>

    <div class="diff-sidebar">
      <div class="diff-section">Tools</div>
      <div class="diff-buttons">
        <button class="diff-button" type="button">
        <span class="diff-button-text">To lowercase</span>
        </button>
        <button class="diff-button" type="button">
        <span class="diff-button-text">Sort lines</span>
        </button>
      </div>
    </div>
    
    <div class='container'>
      <div class="row" id="inputDiv">
        <p>Input</p>
        <div class="col-md-6">
          <div class="form-outline">
            <textarea class="form-control" id="leftInput" rows="12" v-model="input.left"></textarea>
            <label class="form-label" for="leftInput"></label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-outline">
            <textarea class="form-control" id="rightInput" rows="12" v-model="input.right"></textarea>
            <label class="form-label" for="rightInput"></label>
          </div>
        </div>
        <div class="text-center">
          <button type="submit" class="btn btn-primary col-md-1" @click="submitInput">diff</button>
        </div>
      </div>
    
    
       <div>
        <ul class="input_list">
          <li>姓名：<a-input v-model:value="userinfo.username"></a-input></li>
          <li>年龄：<a-input v-model:value="userinfo.age"></a-input></li>
          <li>
            性别：
            <a-radio-group v-model:value="userinfo.sex">
              <a-radio value="男">男</a-radio>
              <a-radio value="女">女</a-radio>
            </a-radio-group>
          </li>
          <li>
            爱好：
            <span v-for="(item, index) in userinfo.hobbies" :key="index">
              <a-checkbox v-model:checked="item.checked">{{
                item.label
              }}</a-checkbox>
            </span>
          </li>
          <li>
            城市：
            <a-select
              v-model:value="userinfo.selectedCity"
              mode="tags"
              style="width: 300px"
              placeholder="选择城市"
              :options="userinfo.options"
            >
            </a-select>
          </li>
          <li>
            生日：
            <a-date-picker v-model:value="userinfo.birthday" @change="pickerChange" />
          </li>
        </ul>
      </div>
    </div>
    </template>
    
    
    <script>
    import { defineComponent } from 'vue';
    import { mapActions } from 'vuex';
    import axios from 'axios';
    import moment from 'moment';
    const dateFormat = "YYYY-MM-DD";
    
    export default defineComponent({
      name: 'Test',
      data() {
        return {
          userinfo: {
            username: "",
            age: "",
            sex: "男",
            hobbies: [
              { label: "吃饭", checked: true },
              { label: "睡觉", checked: true },
              { label: "写代码", checked: false },
            ],
            options: [
              { value: "北京" },
              { value: "上海" },
              { value: "广州" },
              { value: "深圳" },
            ],
            selectedCity: ["北京"],
            birthday: moment('2021-01-03', dateFormat),
          },
          input: {
            left: '',
            right: '',
            option: '',
          },
          output: {
            left: '',
            right: '',
          },
        };
      },
      methods: {
        async submitInput() {
          try {
            var response = await axios.post('diff', this.input);
            response = response.data;
            console.log(response);
            this.output.left = response.left.join("\n");
            this.output.right = response.right.join("\n");
          } catch (error) {
            throw 'Error input';
          }
        },
        pickerChange(e) {
          // console.log(e._d)
          if (!e) return;
          var oDate = new Date(e._d);
          console.log(oDate.getTime());
        },
      },
    });
    </script>
    
    <style type="text/css">
      
    
    
    </style>