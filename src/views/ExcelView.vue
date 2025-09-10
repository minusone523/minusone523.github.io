<template>
  <div class="excel-view-container">
    <!-- 添加一个可滚动的容器 -->
    <div class="table-container">
      <hot-table 
        ref="hotTable"
        :settings="settings"  
        :style="style"
      >
      </hot-table>
    </div>
    
    <!-- 添加图表控制面板 -->
    <div class="chart-controls">
      <div class="control-group">
        <label>X轴数据行/列:</label>
        <input v-model="chartConfig.xAxis" placeholder="例如: 1 或 A" />
      </div>
      <div class="control-group">
        <label>Y轴数据行/列:</label>
        <input v-model="chartConfig.yAxis" placeholder="例如: 2,3 或 B,C" />
      </div>
      <div class="control-group">
        <label>图表类型:</label>
        <select v-model="chartConfig.type">
          <option value="line">折线图</option>
          <option value="bar">柱状图</option>
          <option value="scatter">散点图</option>
        </select>
      </div>
      <button @click="plotChart">绘制图表</button>
      <button @click="clearChart">清除图表</button>
    </div>

    <!-- 图表显示区域 -->
    <div v-if="chartData" class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
// 引入Chart.js
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, ScatterController } from 'chart.js';

// 注册Chart.js组件
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, ScatterController);

// register Handsontable's modules
registerAllModules();

export default defineComponent({
  data() {
    const minRows = 16;
    const minCols = 16;
    
    return {
      settings: {
        // height: 'auto',
        colHeaders: true,
        rowHeaders: true,
        licenseKey: 'non-commercial-and-evaluation',
        // 使用动态生成的数据
        data: this.generateEmptyData(minRows, minCols),
        // 添加自动高度调整配置
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        // 添加上下文菜单以支持增删行列
        contextMenu: [
          'row_above',
          'row_below',
          '---------',
          'col_left',
          'col_right',
          '---------',
          'remove_row',
          'remove_col',
          '---------',
          'undo',
          'redo'
        ],
        // 允许手动添加行列
        minRows: minRows,
        minCols: minCols,
        maxRows: 256,
        maxCols: 50,
        allowInsertRow: true,
        allowInsertColumn: true,
        allowRemoveRow: true,
        allowRemoveColumn: true,
        // 添加选中结束事件处理
        afterSelectionEnd: this.handleSelectionEnd,
        // 添加更改事件处理
        afterChange: this.handleChange,
        // 添加键盘事件处理
        afterDocumentKeyDown: this.handleKeyDown
      },
      // 修改样式，设置固定高度
      style: 'width: 100%; height: 400px;',
      // 添加图表配置数据
      chartConfig: {
        xAxis: '',
        yAxis: '',
        type: 'line'
      },
      chartData: null,
      chartInstance: null,
      // 记录当前选中位置
      currentSelection: {
        startRow: -1,
        endRow: -1,
        startCol: -1,
        endCol: -1
      }
    };
  },
  components: {
    HotTable,
  },
  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    // 销毁图表实例
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  },
  methods: {
    // 添加生成空数据的方法
    generateEmptyData(rows, cols) {
      const data = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push('');
        }
        data.push(row);
      }
      return data;
    },
    handleResize() {
      // 设置固定高度，避免表格占据过多空间
      this.style = 'width: 100%; height: 400px;';
      
      // 重新渲染表格以适应新尺寸
      if (this.$refs.hotTable && this.$refs.hotTable.hotInstance) {
        this.$refs.hotTable.hotInstance.render();
      }
    },
    // 处理选中结束事件
    handleSelectionEnd(row, column, row2, column2) {
      // 更新当前选中位置记录
      this.currentSelection = {
        startRow: row,
        endRow: row2,
        startCol: column,
        endCol: column2
      };
      
      // 移除自动添加行列的逻辑，只在键盘事件中处理
    },
    
    // 处理键盘事件
    handleKeyDown(event) {
      const hotInstance = this.$refs.hotTable.hotInstance;
      if (!hotInstance) return;
      
      const totalRows = hotInstance.countRows();
      const totalCols = hotInstance.countCols();
      
      // 获取当前选中范围
      const { startRow, endRow, startCol, endCol } = this.currentSelection;
      
      // 只有当选中了最后一行或最后一列时，才根据方向键添加新行或新列
      switch (event.key) {
        case 'ArrowDown':
          // 如果选中了最后一行，则添加新行
          if (endRow === totalRows - 1) {
            hotInstance.alter('insert_row_below', totalRows);
            event.preventDefault(); // 阻止默认行为，避免跳转
            // 保持光标在当前列的新增行上
            this.$nextTick(() => {
              hotInstance.selectCell(totalRows, startCol, totalRows, endCol);
            });
          }
          break;
        case 'ArrowRight':
          // 如果选中了最后一列，则添加新列
          if (endCol === totalCols - 1) {
            hotInstance.alter('insert_col_end', totalCols);
            event.preventDefault(); // 阻止默认行为，避免跳转
            // 保持光标在当前行的新增列上
            this.$nextTick(() => {
              hotInstance.selectCell(startRow, totalCols, endRow, totalCols);
            });
          }
          break;
      }
    },
    
    // 处理更改事件
    handleChange(changes, source) {
      if (!changes) return;
      
      const hotInstance = this.$refs.hotTable.hotInstance;
      const totalRows = hotInstance.countRows();
      const totalCols = hotInstance.countCols();
      
      let needAddRow = false;
      let needAddCol = false;
      
      // 检查是否有在最后一行或最后一列的更改
      for (let i = 0; i < changes.length; i++) {
        const [row, prop, oldValue, newValue] = changes[i];
        
        // 如果在最后一行输入了内容，则准备添加新行
        if (row === totalRows - 1 && newValue !== null && newValue !== '') {
          needAddRow = true;
        }
        
        // 如果在最后一列输入了内容，则准备添加新列
        if (typeof prop === 'number' && prop === totalCols - 1 && newValue !== null && newValue !== '') {
          needAddCol = true;
        }
      }
      
      // 根据需要添加新行或新列
      if (needAddRow) {
        // 修改为正确的API方法
        hotInstance.alter('insert_row_below', totalRows);
      }
      
      if (needAddCol) {
        // 修改为正确的API方法
        hotInstance.alter('insert_col_end', totalCols);
      }
    },
    
    // 新增: 解析行列标识符（数字或字母）
    parseCellIdentifier(identifier, maxRows, maxCols) {
      // 如果是数字，减1以适应0基索引
      if (!isNaN(identifier)) {
        const index = parseInt(identifier) - 1;
        return index >= 0 ? index : -1;
      }
      
      // 如果是字母，转换为列索引
      const colIndex = identifier.toUpperCase().charCodeAt(0) - 65;
      if (colIndex >= 0 && colIndex < maxCols) {
        return colIndex;
      }
      
      return -1;
    },
    
    // 新增: 获取指定行列的数据
    getDataByIndex(index, isRow = true) {
      const hotInstance = this.$refs.hotTable.hotInstance;
      if (!hotInstance) return [];
      
      const data = hotInstance.getData();
      if (isRow) {
        // 获取指定行的数据
        return index < data.length ? data[index] : [];
      } else {
        // 获取指定列的数据
        return data.map(row => index < row.length ? row[index] : null);
      }
    },
    
    // 新增: 绘制图表
    plotChart() {
      const hotInstance = this.$refs.hotTable.hotInstance;
      if (!hotInstance) return;
      
      const maxRows = hotInstance.countRows();
      const maxCols = hotInstance.countCols();
      
      // 解析X轴数据
      const xAxisIndex = this.parseCellIdentifier(this.chartConfig.xAxis, maxRows, maxCols);
      if (xAxisIndex === -1) {
        alert('无效的X轴标识符');
        return;
      }
      
      // 获取X轴数据
      const isXRow = !isNaN(this.chartConfig.xAxis); // 如果是数字则是行，否则是列
      const xAxisData = this.getDataByIndex(xAxisIndex, isXRow)
        .filter(cell => cell !== null && cell !== '')
        .map(cell => {
          // 尝试转换为数字
          const num = parseFloat(cell);
          return isNaN(num) ? cell : num;
        });
      
      // 解析Y轴数据
      const yAxisIdentifiers = this.chartConfig.yAxis.split(',').map(id => id.trim());
      const yAxisDatasets = [];
      
      for (const identifier of yAxisIdentifiers) {
        const yAxisIndex = this.parseCellIdentifier(identifier, maxRows, maxCols);
        if (yAxisIndex === -1) {
          alert(`无效的Y轴标识符: ${identifier}`);
          return;
        }
        
        // 获取Y轴数据
        const isYRow = !isNaN(identifier); // 如果是数字则是行，否则是列
        const yAxisData = this.getDataByIndex(yAxisIndex, isYRow)
          .filter(cell => cell !== null && cell !== '')
          .map(cell => {
            // 尝试转换为数字
            const num = parseFloat(cell);
            return isNaN(num) ? cell : num;
          });
        
        // 调整标签显示，使行号从1开始
        const labelIndex = isYRow ? yAxisIndex + 1 : identifier.toUpperCase();
        yAxisDatasets.push({
          label: isYRow ? `Row ${labelIndex}` : `Column ${identifier.toUpperCase()}`,
          data: yAxisData.slice(0, xAxisData.length), // 保证数据长度一致
          borderColor: this.getRandomColor(),
          backgroundColor: this.getRandomColor(0.2)
        });
      }
      
      // 准备图表数据
      this.chartData = {
        labels: xAxisData,
        datasets: yAxisDatasets
      };
      
      // 在控制台输出解析的数据
      console.log('X轴数据:', xAxisData);
      console.log('Y轴数据:', yAxisDatasets);
      
      // 渲染图表
      this.$nextTick(() => {
        this.renderChart();
      });
    },
    
    // 新增: 渲染图表
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
      
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: this.chartConfig.type,
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },
    
    // 新增: 生成随机颜色
    getRandomColor(alpha = 1) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    // 新增: 清除图表
    clearChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      this.chartData = null;
    }
  }
});
</script>

<style scoped>
.excel-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 修改表格容器样式，设置固定高度并允许滚动 */
.table-container {
  height: 400px;
  position: relative;
  min-height: 300px;
  overflow: auto;
}

.chart-controls {
  display: flex;
  gap: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin: 10px 0;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.control-group label {
  margin-bottom: 5px;
  font-weight: bold;
}

.control-group input,
.control-group select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.chart-container {
  flex: 1;
  min-height: 400px;
  margin: 20px 0;
  position: relative;
  flex-shrink: 0;
  overflow: visible; /* 允许内容溢出显示 */
  /* 添加底部内边距确保x轴标签可见 */
  padding-bottom: 30px;
}
</style>