<template>

    <div class="row" id="inputDiv">
      <p>Input</p>
      <div class="col-md-6">
        <div class="form-outline">
          <textarea class="form-control" id="leftInput" rows="12" v-model="diff.left"></textarea>
          <label class="form-label" for="leftInput"></label>
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-outline">
          <textarea class="form-control" id="rightInput" rows="12" v-model="diff.right"></textarea>
          <label class="form-label" for="rightInput"></label>
        </div>
      </div>
      <div class="text-center">
        <button type="submit" class="btn btn-primary col-md-1" @click="sort">sort</button>
        <button type="submit" class="btn btn-primary col-md-1" @click="split('--')">split--</button>
        <button type="submit" class="btn btn-primary col-md-1" @click="diffParams()">diffParams</button>
        <button type="submit" class="btn btn-primary col-md-1" @click="split(';')">split;</button>
        <button type="submit" class="btn btn-primary col-md-2" @click="remove(' ')">remove whitespace</button>
        <button type="submit" class="btn btn-primary col-md-2" @click="split(','),split(';'),remove(' '),sort">ALL</button>
      </div>
      <br><br>
      <div class="text-center">
        <button type="save" class="btn btn-primary col-md-1" @click="save">save</button>
        <button type="load" class="btn btn-primary col-md-1" @click="load">load</button>
      </div>
    </div>
  
    <code-diff
      v-model:old-string="diff.left"
      v-model:new-string="diff.right"
      output-format="side-by-side"
    />
    
  
  </template>
  
  
  <script>
  import { defineComponent } from 'vue';
  import { mapActions } from 'vuex';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'Diff',
    data() {
      return {
        diff: {
          left: 'a\nb\nc,d',
          right: 'd,c,a,b,x',
          option: '',
        },
      };
    },
    methods: {
      diffParams() {
        function sortObjectRecursively(value) {
          if (Array.isArray(value)) {
            return value.map(sortObjectRecursively);
          } else if (value !== null && typeof value === 'object') {
            const sortedKeys = Object.keys(value).sort();
            const result = {};
            for (const key of sortedKeys) {
              result[key] = sortObjectRecursively(value[key]);
            }
            return result;
          }
          return value;
        }
        function processParams(text) {
          var lines = text.split('--').map(s => s.trim()).filter(line => line.length > 0);
          lines.sort();
          lines = lines.map(line => {
            const prefix = "model_args=";
            if (line.startsWith(prefix)) {
              // 提取 JSON 字符串
              const jsonStr = line.slice(prefix.length+1, -1);
              try {
                const obj = JSON.parse(jsonStr);
                const sortedObj = sortObjectRecursively(obj);
                const sortedJsonStr = JSON.stringify(sortedObj);
                return prefix + "'" + sortedJsonStr + "'";
              } catch (e) {
                console.warn('JSON 解析失败，保留原始行:', line);
                return line;
              }
            }
            return line;
          });
          const result = lines.map(l => '--' + l).join('\n');
          return result;
        }
        this.diff.left = processParams(this.diff.left);
        this.diff.right = processParams(this.diff.right);
      },
      split(sep) {
        this.diff.left = this.diff.left.replaceAll(sep, '\n');
        this.diff.right = this.diff.right.replaceAll(sep, '\n');
      },
      sort() {
        this.diff.left = this.diff.left.split('\n').sort().join("\n");
        this.diff.right = this.diff.right.split('\n').sort().join("\n");
      },
      remove(c) {
        this.diff.left = this.diff.left.replaceAll(c, '');
        this.diff.right = this.diff.right.replaceAll(c, '');
      },
      save() {
        localStorage.clear();
        var timestamep = (new Date()).getTime();
        var data = JSON.stringify({
          left: this.diff.left,
          right: this.diff.right
        });
        console.log("save: ", data);
        localStorage.setItem(timestamep, data);
      },
      load() {
        var data = JSON.parse(localStorage.getItem(localStorage.key(localStorage.length - 1)));
        this.diff.left = data.left;
        this.diff.right = data.right;
      }
  
    },
  });
  </script>
  