<!-- src/views/TreeNode.vue -->
<template>
  <div class="tree-node" :class="node.type">
    <div 
      class="node-header" 
      @click="toggleNode"
      :class="{ clickable: hasChildren }"
    >
      <span class="toggle-icon" v-if="hasChildren">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span class="toggle-icon-placeholder" v-else></span>
      
      <!-- 不显示 root 节点的 key -->
      <span v-if="path !== 'root'" class="node-key" :title="path">{{ displayName }}</span>
      
      <span class="node-type-badge" :class="node.type">
        {{ getTypeLabel(node.type) }}
      </span>
      
      <span class="node-value" v-if="!hasChildren || node.type !== 'object' && node.type !== 'array'">
        <span v-if="node.type === 'added'" class="value-added">+ {{ formatValue(node.newValue) }}</span>
        <span v-else-if="node.type === 'removed'" class="value-removed">- {{ formatValue(node.oldValue) }}</span>
        <span v-else-if="node.type === 'modified'" class="value-modified">
          <span class="old-value">{{ formatValue(node.oldValue) }}</span>
          <span class="arrow"> → </span>
          <span class="new-value">{{ formatValue(node.newValue) }}</span>
        </span>
        <span v-else-if="node.type === 'error'" class="value-error">{{ node.value }}</span>
        <span v-else class="value-normal">{{ formatValue(getDisplayValue()) }}</span>
      </span>
    </div>
    
    <div class="node-children" v-if="isExpanded && hasChildren">
      <tree-node
        v-for="(childNode, childKey) in node.children"
        :key="childKey"
        :node="childNode"
        :path="childKey"
        :expanded-nodes="expandedNodes"
        @toggle-expand="emitToggleExpand"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    expandedNodes: {
      type: Set,
      required: true
    }
  },
  emits: ['toggle-expand'],
  computed: {
    isExpanded() {
      return this.expandedNodes.has(this.path);
    },
    hasChildren() {
      return this.node.children && Object.keys(this.node.children).length > 0;
    },
    displayName() {
      // 如果路径是数组索引格式，显示为索引
      if (this.path.startsWith('[') && this.path.endsWith(']')) {
        return this.path;
      }
      return this.path;
    }
  },
  methods: {
    toggleNode() {
      if (this.hasChildren) {
        this.$emit('toggle-expand', this.path);
      }
    },
    emitToggleExpand(path) {
      this.$emit('toggle-expand', path);
    },
    getTypeLabel(type) {
      const labels = {
        'added': '新增',
        'removed': '删除',
        'modified': '修改',
        'object': '对象',
        'array': '数组',
        'error': '错误'
      };
      return labels[type] || type;
    },
    formatValue(value) {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    },
    getDisplayValue() {
      if (this.node.type === 'object') {
        return '{}';
      } else if (this.node.type === 'array') {
        return '[]';
      }
      return this.node.newValue !== undefined ? this.node.newValue : this.node.oldValue;
    }
  }
});
</script>

<style scoped>
.tree-node {
  margin: 2px 0;
  border-left: 2px solid transparent;
}

.tree-node.added {
  border-left-color: #28a745;
  background-color: rgba(40, 167, 69, 0.05);
}

.tree-node.removed {
  border-left-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.tree-node.modified {
  border-left-color: #ffc107;
  background-color: rgba(255, 193, 7, 0.05);
}

.tree-node.object, .tree-node.array {
  border-left-color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.tree-node.error {
  border-left-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 3px;
  gap: 8px;
}

.node-header.clickable {
  cursor: pointer;
}

.node-header.clickable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.toggle-icon {
  width: 16px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.toggle-icon-placeholder {
  width: 16px;
}

.node-key {
  font-weight: bold;
  color: #007bff;
  flex-shrink: 0;
}

.node-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
}

.node-type-badge.added {
  background-color: #28a745;
}

.node-type-badge.removed {
  background-color: #dc3545;
}

.node-type-badge.modified {
  background-color: #ffc107;
}

.node-type-badge.object, .node-type-badge.array {
  background-color: #007bff;
}

.node-type-badge.error {
  background-color: #dc3545;
}

.node-value {
  flex: 1;
  margin-left: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value-added {
  color: #28a745;
  font-weight: bold;
}

.value-removed {
  color: #dc3545;
  text-decoration: line-through;
}

.value-modified {
  display: flex;
  align-items: center;
  gap: 4px;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
}

.arrow {
  color: #666;
}

.new-value {
  color: #28a745;
  font-weight: bold;
}

.value-error {
  color: #dc3545;
  font-weight: bold;
}

.value-normal {
  color: #333;
}

.node-children {
  margin-left: 20px;
  border-left: 1px dashed #ddd;
  padding-left: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-header {
    flex-wrap: wrap;
  }
  
  .node-value {
    margin-left: 0;
    width: 100%;
    margin-top: 4px;
  }
}
</style>