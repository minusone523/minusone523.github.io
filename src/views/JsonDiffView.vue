<!-- src/views/JsonTreeDiffView.vue -->
<template>
  <div class="json-tree-diff-container">
    <h2 class="title">JSON Tree Diff 工具</h2>
    <div class="diff-controls">
      <button @click="swapJson" class="swap-btn">⇄ 交换</button>
      <button @click="clearAll" class="clear-btn">清空</button>
      <button @click="compareJson" class="compare-btn">比较</button>
      <button @click="expandAll" class="expand-btn">展开全部</button>
      <button @click="collapseAll" class="collapse-btn">收起全部</button>
      <label class="auto-diff-label">
        <input 
          type="checkbox" 
          v-model="autoDiff" 
          @change="onAutoDiffChange"
        />
        自动比较
      </label>
    </div>
    
    <div class="json-inputs">
      <div class="json-section">
        <h4>JSON 1</h4>
        <textarea
          v-model="json1"
          placeholder="请输入第一个 JSON"
          class="json-textarea"
          @input="onJsonInput"
        ></textarea>
        <div v-if="json1Error" class="json-error">
          ❌ JSON 1 解析出错：{{ json1Error }}
        </div>
      </div>
      
      <div class="json-section">
        <h4>JSON 2</h4>
        <textarea
          v-model="json2"
          placeholder="请输入第二个 JSON"
          class="json-textarea"
          @input="onJsonInput"
        ></textarea>
        <div v-if="json2Error" class="json-error">
          ❌ JSON 2 解析出错：{{ json2Error }}
        </div>
      </div>
    </div>
    
    <!-- 保存/加载部分 -->
    <div class="save-load-section">
      <div class="save-load-controls">
        <input
          v-model="versionName"
          class="version-input"
          placeholder="保存名称"
        />
        <button class="save-btn" @click="saveVersion">Save</button>

        <select
          v-model="selectedVersion"
          class="version-select"
        >
          <option disabled value="">选择版本</option>
          <option v-for="name in versions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
        <button
          class="load-btn"
          @click="loadVersion"
          :disabled="!selectedVersion"
        >
          Load
        </button>
      </div>
    </div>
    
    <div class="diff-result" v-if="diffTree && !json1Error && !json2Error">
      <h4>差异树状视图</h4>
      <div class="tree-container">
        <div v-if="Object.keys(diffTree).length === 0" class="no-diff">
          两个 JSON 完全相同
        </div>
        <div v-else class="tree-view">
          <tree-node
            v-for="(node, key) in diffTree"
            :key="key"
            :node="node"
            :path="key"
            :expanded-nodes="expandedNodes"
            @toggle-expand="toggleExpand"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
// 引入 jsonlint-mod
import { parse } from 'jsonlint-mod';

// 树节点组件（递归组件）
const TreeNode = defineAsyncComponent(() => import('./TreeNode.vue'));

export default defineComponent({
  name: 'JsonTreeDiffView',
  components: {
    TreeNode
  },
  data() {
    return {
      json1: `{
  "name": "张三",
  "age": 25,
  "address": {
    "city": "北京",
    "district": "朝阳区"
  },
  "hobbies": ["读书", "游泳"]
}`,
      json2: `{
  "name": "张三",
  "age": 26,
  "address": {
    "city": "上海",
    "district": "浦东新区"
  },
  "hobbies": ["读书", "游泳", "跑步"],
  "email": "zhangsan@example.com"
}`,
      diffTree: {},
      expandedNodes: new Set(),
      autoDiff: true,
      debounceTimer: null,
      json1Error: '',
      json2Error: '',
      versionName: '',
      versions: [],
      selectedVersion: ''
    };
  },
  mounted() {
    // 组件挂载时自动比较
    if (this.autoDiff) {
      this.compareJson();
    }
    
    // 加载保存的版本列表
    const list = localStorage.getItem('json_diff_versions');
    this.versions = list ? JSON.parse(list) : [];
  },
  methods: {
    // 交换两个 JSON
    swapJson() {
      [this.json1, this.json2] = [this.json2, this.json1];
      this.json1Error = '';
      this.json2Error = '';
      if (this.autoDiff) {
        this.compareJson();
      }
    },
    
    // 清空所有内容
    clearAll() {
      this.json1 = '';
      this.json2 = '';
      this.diffTree = {};
      this.expandedNodes.clear();
      this.json1Error = '';
      this.json2Error = '';
    },
    
    // JSON 输入时的处理
    onJsonInput() {
      this.json1Error = '';
      this.json2Error = '';
      
      if (this.autoDiff) {
        // 防抖处理
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
          this.compareJson();
        }, 500);
      }
    },
    
    // 自动比较开关变化
    onAutoDiffChange() {
      if (this.autoDiff) {
        this.compareJson();
      }
    },
    
    // 展开全部节点 - 修复版本
    expandAll() {
      this.expandedNodes.clear();
      this.expandAllNodesRecursive(this.diffTree);
    },
    
    // 递归展开所有节点
    expandAllNodesRecursive(nodes) {
      if (!nodes) return;
      
      Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        // 添加当前节点到展开集合（如果它有子节点）
        if (node.children && Object.keys(node.children).length > 0) {
          this.expandedNodes.add(key);
          // 递归展开子节点
          this.expandAllNodesRecursive(node.children);
        }
      });
    },
    
    // 收起全部节点
    collapseAll() {
      this.expandedNodes.clear();
    },
    
    // 切换节点展开状态
    toggleExpand(path) {
      if (this.expandedNodes.has(path)) {
        this.expandedNodes.delete(path);
      } else {
        this.expandedNodes.add(path);
      }
    },
    
    // 保存版本
    saveVersion() {
      const name = this.versionName.trim();
      if (!name) return alert('请填写保存名称');
      localStorage.setItem(
        `json_diff_${name}`,
        JSON.stringify({ left: this.json1, right: this.json2 })
      );
      if (!this.versions.includes(name)) {
        this.versions.push(name);
        localStorage.setItem('json_diff_versions', JSON.stringify(this.versions));
      }
      this.versionName = '';
    },
    
    // 加载版本
    loadVersion() {
      const name = this.selectedVersion;
      const data = localStorage.getItem(`json_diff_${name}`);
      if (!data) return alert(`版本 "${name}" 不存在`);
      const obj = JSON.parse(data);
      this.json1 = obj.left;
      this.json2 = obj.right;
      this.json1Error = '';
      this.json2Error = '';
      this.compareJson();
    },
    
    // 安全解析 JSON
    safeParse(jsonStr, jsonNum) {
      if (!jsonStr || !jsonStr.trim()) {
        return null;
      }
      
      try {
        return parse(jsonStr);
      } catch (error) {
        // 根据是哪个 JSON 设置对应的错误信息
        if (jsonNum === 1) {
          this.json1Error = error.message;
        } else {
          this.json2Error = error.message;
        }
        return null;
      }
    },
    
    // 比较两个 JSON
    compareJson() {
      // 清除之前的错误
      this.json1Error = '';
      this.json2Error = '';
      
      if (!this.json1.trim() && !this.json2.trim()) {
        this.diffTree = {};
        return;
      }
      
      // 解析两个 JSON
      const obj1 = this.safeParse(this.json1, 1);
      const obj2 = this.safeParse(this.json2, 2);
      
      // 如果有解析错误，不继续比较
      if (this.json1Error || this.json2Error) {
        this.diffTree = {};
        return;
      }
      
      try {
        // 生成差异树
        this.diffTree = this.generateDiffTree(obj1, obj2);
        this.expandedNodes.clear();
        
        // 默认展开第一层节点
        Object.keys(this.diffTree).forEach(key => {
          this.expandedNodes.add(key);
        });
        
      } catch (error) {
        this.diffTree = {};
      }
    },
    
    // 生成差异树
    generateDiffTree(obj1, obj2, path = '') {
      const result = {};
      
      // 如果两个对象完全相等
      if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
        return result;
      }
      
      // 处理 null 或 undefined
      if (obj1 === null || obj1 === undefined) {
        if (obj2 !== null && obj2 !== undefined) {
          const key = path || 'root';
          result[key] = {
            type: 'added',
            oldValue: obj1,
            newValue: obj2,
            children: {}
          };
        }
        return result;
      }
      
      if (obj2 === null || obj2 === undefined) {
        if (obj1 !== null && obj1 !== undefined) {
          const key = path || 'root';
          result[key] = {
            type: 'removed',
            oldValue: obj1,
            newValue: obj2,
            children: {}
          };
        }
        return result;
      }
      
      // 处理基本类型
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        if (obj1 !== obj2) {
          const key = path || 'root';
          result[key] = {
            type: 'modified',
            oldValue: obj1,
            newValue: obj2,
            children: {}
          };
        }
        return result;
      }
      
      // 处理数组
      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        const key = path || 'root';
        const node = {
          type: 'array',
          oldValue: obj1,
          newValue: obj2,
          children: {}
        };
        
        const maxLength = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLength; i++) {
          const arrayKey = `[${i}]`;
          const childPath = path ? `${path}${arrayKey}` : arrayKey;
          
          if (i >= obj1.length) {
            node.children[arrayKey] = {
              type: 'added',
              oldValue: undefined,
              newValue: obj2[i],
              children: {}
            };
          } else if (i >= obj2.length) {
            node.children[arrayKey] = {
              type: 'removed',
              oldValue: obj1[i],
              newValue: undefined,
              children: {}
            };
          } else {
            const childDiff = this.generateDiffTree(obj1[i], obj2[i], childPath);
            Object.assign(node.children, childDiff);
          }
        }
        
        result[key] = node;
        return result;
      }
      
      // 处理对象
      if (!Array.isArray(obj1) && !Array.isArray(obj2)) {
        const key = path || 'root';
        const node = {
          type: 'object',
          oldValue: obj1,
          newValue: obj2,
          children: {}
        };
        
        // 找出所有键
        const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
        
        for (const objKey of allKeys) {
          const childPath = path ? `${path}.${objKey}` : objKey;
          const childDiff = this.generateDiffTree(obj1[objKey], obj2[objKey], childPath);
          Object.assign(node.children, childDiff);
        }
        
        // 只有当有子差异才添加节点
        if (Object.keys(node.children).length > 0) {
          result[key] = node;
        }
        return result;
      }
      
      // 类型不匹配
      const key = path || 'root';
      result[key] = {
        type: 'modified',
        oldValue: obj1,
        newValue: obj2,
        children: {}
      };
      
      return result;
    }
  },
  
  beforeUnmount() {
    // 清除定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  },
  
  activated() {
    // 组件激活时的逻辑
  },
  
  deactivated() {
    // 组件失活时的逻辑
  }
});
</script>

<style scoped>
.json-tree-diff-container {
  padding: 10px 20px 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  color: #333;
  margin: 10px 0 15px 0;
  text-align: center;
}

.diff-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.swap-btn, .clear-btn, .compare-btn, .expand-btn, .collapse-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.auto-diff-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.auto-diff-label input[type="checkbox"] {
  cursor: pointer;
}

.swap-btn {
  background-color: #17a2b8;
  color: white;
}

.swap-btn:hover {
  background-color: #138496;
}

.clear-btn {
  background-color: #dc3545;
  color: white;
}

.clear-btn:hover {
  background-color: #c82333;
}

.compare-btn {
  background-color: #28a745;
  color: white;
}

.compare-btn:hover {
  background-color: #218838;
}

.expand-btn {
  background-color: #6c757d;
  color: white;
}

.expand-btn:hover {
  background-color: #5a6268;
}

.collapse-btn {
  background-color: #6c757d;
  color: white;
}

.collapse-btn:hover {
  background-color: #5a6268;
}

.json-inputs {
  display: flex;
  gap: 25px;
  margin-bottom: 20px;
  height: 500px;
}

.json-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-section h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.json-textarea {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  background-color: #f8f9fa;
}

.json-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* JSON 错误信息样式 */
.json-error {
  color: #dc3545;
  font-size: 14px;
  margin-top: 8px;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 保存/加载部分样式 */
.save-load-section {
  margin-bottom: 20px;
}

.save-load-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.version-input, .version-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.version-input {
  width: 120px;
}

.version-select {
  width: 150px;
}

.save-btn, .load-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
}

.load-btn {
  background-color: #17a2b8;
  color: white;
}

.load-btn:hover {
  background-color: #138496;
}

.load-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.diff-result {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background-color: #fff;
}

.diff-result h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.tree-container {
  min-height: 200px;
}

.no-diff {
  color: #28a745;
  font-weight: bold;
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.tree-view {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-tree-diff-container {
    padding: 10px;
  }
  
  .json-inputs {
    flex-direction: column;
    height: auto;
    gap: 15px;
  }
  
  .diff-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .save-load-controls {
    flex-direction: column;
  }
  
  .version-input, .version-select, .save-btn, .load-btn {
    width: 100%;
    text-align: center;
  }
  
  .swap-btn, .clear-btn, .compare-btn, .expand-btn, .collapse-btn, .auto-diff-label {
    width: 100%;
    text-align: center;
  }
}
</style>