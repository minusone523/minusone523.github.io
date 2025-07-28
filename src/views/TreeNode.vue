<template>
  <div class="tree-node" :class="node.type">
    <div
      class="node-header"
      @click="toggleNode"
      :class="{ clickable: hasChildren }"
    >
      <!-- Toggle Icon -->
      <span class="toggle-icon" v-if="hasChildren">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span class="toggle-icon-placeholder" v-else></span>

      <!-- Key Column (窄且固定宽度) - 显示带空格前缀的 displayName -->
      <!-- v-if="path !== 'root'" 移到内部，确保根节点也渲染容器以保持布局 -->
      <div class="node-key-column" :title="displayName">
        <span v-if="path !== 'root'" class="node-key">{{ indentedDisplayName }}</span>
      </div>

      <!-- Type Badge -->
      <span class="node-type-badge" :class="node.type">
        {{ getTypeLabel(node.type) }}
      </span>

      <!-- Diff Columns (宽且等宽) - 仅对非 root 节点显示 -->
      <div class="node-diff-columns" v-if="path !== 'root'">
        <!-- Diff 1 Column (JSON1 / oldValue) -->
        <div class="node-diff-column json1-column">
          <span
            :class="{
              'value-removed': node.type === 'removed' || node.type === 'modified',
              'value-normal': node.type === 'added' || node.type === 'object' || node.type === 'array'
            }"
          >
            <!-- 对于 added 节点，JSON1 列显示占位符 -->
            <span v-if="node.type === 'added'">-</span>
            <span v-else>{{ formatValue(node.oldValue) }}</span>
          </span>
        </div>

        <!-- Diff 2 Column (JSON2 / newValue) -->
        <div class="node-diff-column json2-column">
          <span
            :class="{
              'value-added': node.type === 'added' || node.type === 'modified',
              'value-normal': node.type === 'removed' || node.type === 'object' || node.type === 'array'
            }"
          >
            <!-- 对于 removed 节点，JSON2 列显示占位符 -->
            <span v-if="node.type === 'removed'">-</span>
            <span v-else>{{ formatValue(node.newValue) }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="node-children" v-if="isExpanded && hasChildren">
      <tree-node
        v-for="(childNode, childKey) in node.children"
        :key="childKey"
        :node="childNode"
        :path="generateChildPath(childKey)"
        :expanded-nodes="expandedNodes"
        @toggle-expand="$emit('toggle-expand', $event)"
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
    path: { // 当前节点的完整路径
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
    // 原始 displayName，只显示当前层级的 key
    displayName() {
      // 如果路径是数组索引格式，显示为索引
      if (this.path.startsWith('[') && this.path.endsWith(']')) {
        return this.path; // 直接显示 [index]
      }
      // 否则显示最后一个部分作为 key 名称
      const parts = this.path.split(/[\.\[\]]/).filter(p => p !== '');
      return parts[parts.length - 1] || this.path;
    },
    // 计算当前节点的嵌套深度 (基于 path 中分隔符的数量)
    depth() {
       if (this.path === 'root') {
         return -1; // 根节点深度为 -1，方便计算缩进空格数 (depth + 1) * 2
       }
       // 计算 '.' 和 '[' 的数量作为深度
       const separators = (this.path.match(/[\.\[]/g) || []).length;
       return separators;
    },
    // --- 新增计算属性：带缩进空格的 displayName ---
    indentedDisplayName() {
       // 每个深度级别使用 2 个空格进行缩进
       // depth 0 -> 0 spaces, depth 1 -> 2 spaces, depth 2 -> 4 spaces
       const indent = '  '.repeat(Math.max(0, this.depth)); // 确保不会是负数
       return indent + this.displayName;
    }
    // --- 结束新增 ---
  },
  methods: {
    toggleNode() {
      if (this.hasChildren) {
        this.$emit('toggle-expand', this.path);
      }
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
    // 为子节点生成相对于当前节点的完整路径
    generateChildPath(childKey) {
      const currentPath = this.path;
      if (currentPath === 'root') {
        return childKey; // 顶层节点的 path 就是 key 本身
      }
      // 处理数组和对象键的连接
      if (childKey.startsWith('[')) {
        // 数组索引直接拼接，例如 address[0]
        return `${currentPath}${childKey}`;
      } else {
        // 对象属性用点连接，例如 address.city
        return `${currentPath}.${childKey}`;
      }
    }
  }
});
</script>

<style scoped>
.tree-node {
  margin: 2px 0;
  border-left: 2px solid transparent;
}

/* 节点类型边框和背景色保持不变 */
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

.tree-node.object,
.tree-node.array {
  border-left-color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.tree-node.error {
  border-left-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

/* --- 关键修改：移除 margin-left 缩进，使用固定宽度 Key 列 --- */
.node-header {
  display: flex;
  align-items: flex-start;
  padding: 6px 8px;
  border-radius: 3px;
  gap: 8px; /* 列之间的间距 */
  min-height: 32px;
}

.node-header.clickable {
  cursor: pointer;
}

.node-header.clickable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* --- 三列容器 --- */
/* Toggle Icon */
.toggle-icon,
.toggle-icon-placeholder {
  width: 16px;
  text-align: center;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  align-self: center;
}

/* --- 关键修改：Key Column - 固定宽度，但根节点不占用空间 --- */
.node-key-column {
  /* 固定宽度，例如 150px */
  width: 150px;
  font-weight: bold;
  color: #007bff;
  /* 内容处理：允许换行以容纳长 key 和空格 */
  white-space: pre; /* 保留前缀空格 */
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: center;
  /* 可选：添加一点内边距 */
  padding: 0 4px;
}

.node-key {
  /* Key 文本本身 */
}

/* Type Badge */
.node-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
  align-self: center;
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

.node-type-badge.object,
.node-type-badge.array {
  background-color: #007bff;
}

.node-type-badge.error {
  background-color: #dc3545;
}

/* Diff Columns Container - 宽且等宽 */
.node-diff-columns {
  flex: 1;
  display: flex;
  gap: 10px;
  min-width: 0;
}

/* Diff Column (Diff1 和 Diff2) - 宽且等宽 */
.node-diff-column {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap; /* 允许换行 */
  padding: 4px 6px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
}

/* JSON1 列 (通常显示 oldValue) - 淡红色 */
.json1-column {
  background-color: rgba(220, 53, 69, 0.05);
  border-color: rgba(220, 53, 69, 0.1);
}

/* JSON2 列 (通常显示 newValue) - 淡绿色 */
.json2-column {
  background-color: rgba(40, 167, 69, 0.05);
  border-color: rgba(40, 167, 69, 0.1);
}

/* --- 颜色高亮 --- */
.json1-column .value-removed,
.json1-column .value-normal {
  color: #dc3545;
}

.json2-column .value-added,
.json2-column .value-normal {
  color: #28a745;
}

.json1-column span.value-modified {
  color: #dc3545;
  text-decoration: line-through;
}
.json2-column span.value-modified {
  color: #28a745;
  font-weight: bold;
}

/* --- 保持原有样式 --- */
.node-children {
  /* 子节点容器不继承父节点的缩进样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-header {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .node-key-column {
    flex: 1 1 100%;
    max-width: 100%;
    width: auto;
  }

  .node-diff-columns {
    flex: 1 1 100%;
    flex-direction: column;
    width: 100%;
  }

  .node-diff-column {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>
