<template>
  <div class="row" id="inputDiv">
    <p>Input</p>
    <div class="col-md-6">
      <div class="form-outline">
        <textarea
          class="form-control"
          id="leftInput"
          rows="12"
          v-model="diff.left"
        ></textarea>
      </div>
    </div>
    <div class="col-md-6">
      <div class="form-outline">
        <textarea
          class="form-control"
          id="rightInput"
          rows="12"
          v-model="diff.right"
        ></textarea>
      </div>
    </div>

    <!-- 按钮组 + 可选分隔符输入 -->
    <div class="d-flex justify-content-center align-items-center gap-2 my-3">
      <input
        v-model="sep"
        class="form-control form-control-sm col-auto"
        style="max-width: 5rem"
        placeholder="sep"
      />
      <button class="btn btn-primary" @click="onAction(split)">Split</button>
      <button class="btn btn-primary" @click="onAction(sort)">Sort</button>
      <button class="btn btn-primary" @click="onAction(() => remove(' '))">Trim Space</button>
      <button class="btn btn-primary" @click="onAction(lowercase)">Lowercase</button>
      <button class="btn btn-primary" @click="onAction(diffParams)">Diff Params</button>
      <button class="btn btn-primary" @click="onAction(unique)">Unique</button>
      <button class="btn btn-secondary" @click="undo" :disabled="!canUndo">Undo</button>
    </div>

    <!-- 保存/加载部分 -->
    <div class="d-flex justify-content-center align-items-center gap-2 mb-4">
      <input
        v-model="versionName"
        class="form-control form-control-sm col-auto"
        style="max-width: 8rem"
        placeholder="保存名称"
      />
      <button class="btn btn-success btn-sm" @click="saveVersion">Save</button>

      <select
        v-model="selectedVersion"
        class="form-select form-select-sm col-auto"
        style="max-width: 8rem"
      >
        <option disabled value="">选择版本</option>
        <option v-for="name in versions" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
      <button
        class="btn btn-info btn-sm"
        @click="loadVersion"
        :disabled="!selectedVersion"
      >
        Load
      </button>
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

export default defineComponent({
  name: 'Diff',
  data() {
    return {
      diff: { left: '', right: '' },
      sep: '--',
      versionName: '',
      versions: [],
      selectedVersion: '',
      history: [],
      maxHistory: 50,
    };
  },
  computed: {
    canUndo() {
      return this.history.length > 0;
    }
  },
  mounted() {
    const list = localStorage.getItem('diff_versions');
    this.versions = list ? JSON.parse(list) : [];
  },
  methods: {
    // 通用操作包装，记录状态
    onAction(actionFn) {
      this.recordState();
      actionFn();
    },
    recordState() {
      // 限制历史长度
      if (this.history.length >= this.maxHistory) {
        this.history.shift();
      }
      this.history.push({ left: this.diff.left, right: this.diff.right });
    },
    undo() {
      if (!this.canUndo) return;
      const prev = this.history.pop();
      this.diff.left = prev.left;
      this.diff.right = prev.right;
    },
    saveVersion() {
      const name = this.versionName.trim();
      if (!name) return alert('请填写保存名称');
      localStorage.setItem(
        `diff_${name}`,
        JSON.stringify({ left: this.diff.left, right: this.diff.right })
      );
      if (!this.versions.includes(name)) {
        this.versions.push(name);
        localStorage.setItem('diff_versions', JSON.stringify(this.versions));
      }
      this.versionName = '';
    },
    loadVersion() {
      const name = this.selectedVersion;
      const data = localStorage.getItem(`diff_${name}`);
      if (!data) return alert(`版本 "${name}" 不存在`);
      const obj = JSON.parse(data);
      this.diff.left = obj.left;
      this.diff.right = obj.right;
    },
    split() {
      const sep = this.sep;
      this.diff.left = this.diff.left.split(sep).join('\n');
      this.diff.right = this.diff.right.split(sep).join('\n');
    },
    sort() {
      this.diff.left = this.diff.left.split('\n').sort().join('\n');
      this.diff.right = this.diff.right.split('\n').sort().join('\n');
    },
    remove(c) {
      this.diff.left = this.diff.left.replaceAll(c, '');
      this.diff.right = this.diff.right.replaceAll(c, '');
    },
    diffParams() {
      function sortObjectRecursively(value) {
        if (Array.isArray(value)) return value.map(sortObjectRecursively);
        if (value && typeof value === 'object') {
          const result = {};
          Object.keys(value)
            .sort()
            .forEach((key) => {
              result[key] = sortObjectRecursively(value[key]);
            });
          return result;
        }
        return value;
      }
      function processParams(text) {
        return text
          .split('--')
          .map((s) => s.trim())
          .filter((l) => l)
          .sort()
          .map((line) => {
            const prefix = 'model_args=';
            if (line.startsWith(prefix)) {
              const jsonStr = line.slice(prefix.length + 1, -1);
              try {
                const obj = JSON.parse(jsonStr);
                return (
                  prefix + "'" +
                  JSON.stringify(sortObjectRecursively(obj)) +
                  "'"
                );
              } catch {
                return line;
              }
            }
            return line;
          })
          .map((l) => '--' + l)
          .join('\n');
      }
      this.diff.left = processParams(this.diff.left);
      this.diff.right = processParams(this.diff.right);
    },
    lowercase() {
      this.diff.left = this.diff.left.toLowerCase();
      this.diff.right = this.diff.right.toLowerCase();
    },
    unique() {
      const dedup = (text) => {
        const lines = text.split('\n');
        const seen = new Set();
        return lines
          .filter((l) => {
            if (seen.has(l)) return false;
            seen.add(l);
            return true;
          })
          .join('\n');
      };
      this.diff.left = dedup(this.diff.left);
      this.diff.right = dedup(this.diff.right);
    }
  },
});
</script>

<style scoped>
#inputDiv p {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
</style>
