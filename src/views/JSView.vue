<template>
  <!-- Calculator Component -->
  <div class="calculator-container">
    <div class="input-section">
      <textarea
        class="txt"
        v-model="calcInput"
        @input="onInput"
        @keydown.ctrl.enter="evaluateCalc"
        placeholder="支持变量和函数定义：&#10;&#10;变量: x=5&#10;&#10;函数: function add(x, y) { return x + y; }&#10;&#10;调用: add(1, 2)&#10;&#10;Ctrl+Enter 执行计算"
      ></textarea>
    </div>
    <div class="output-section">
      <div class="res" v-html="calcOutput"></div>
    </div>
    <div class="variables-panel" v-if="Object.keys(variables).length > 0 || Object.keys(functions).length > 0">
      <h4>变量和函数：</h4>
      <div class="variables-list">
        <!-- 显示变量 -->
        <div 
          v-for="(value, name) in variables" 
          :key="'var_'+name" 
          class="variable-item"
        >
          <label class="variable-checkbox">
            <input 
              type="checkbox" 
              :checked="persistedVariables.includes(name)"
              @change="toggleVariablePersistence(name)"
            />
            <span class="variable-content">{{ name }} = {{ value }}</span>
          </label>
        </div>
        <!-- 显示函数 -->
        <div 
          v-for="(func, name) in functions" 
          :key="'func_'+name" 
          class="function-item"
        >
          <label class="function-checkbox">
            <input 
              type="checkbox" 
              :checked="persistedFunctions.includes(name)"
              @change="toggleFunctionPersistence(name)"
            />
            <span class="function-content">function {{ name }}({{ func.params.join(', ') }}) {...}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Calculator',
  data() {
    return {
      calcInput: '',
      calcOutput: '输入表达式后按 Ctrl+Enter 执行计算',
      variables: {},
      functions: {}, // 存储函数定义
      persistedVariables: [], // 记录需要持久化的变量名
      persistedFunctions: [], // 记录需要持久化的函数名
      debounceTimer: null,
      lastExecutedInput: '',
      lastKeyPressTime: Date.now(),
    };
  },
  created() {
    // 初始化时加载持久化的变量
    const savedVars = localStorage.getItem('calculator-persisted-variables');
    if (savedVars) {
      try {
        const persistedData = JSON.parse(savedVars);
        this.persistedVariables = persistedData.names || [];
        this.variables = persistedData.values || {};
      } catch (e) {
        console.error('Failed to parse saved variables:', e);
      }
    }
    
    // 初始化时加载持久化的函数
    const savedFuncs = localStorage.getItem('calculator-persisted-functions');
    if (savedFuncs) {
      try {
        const persistedData = JSON.parse(savedFuncs);
        this.persistedFunctions = persistedData.names || [];
        this.functions = persistedData.values || {};
      } catch (e) {
        console.error('Failed to parse saved functions:', e);
      }
    }
  },
  mounted() {
    // 监听键盘事件来跟踪最后按键时间
    this.handleKeyPress = () => {
      this.lastKeyPressTime = Date.now();
    };
    document.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    // 组件销毁前清除定时器和事件监听
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    document.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    // 输入时的处理函数
    onInput() {
      // 清除之前的定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // 设置新的定时器，延迟执行
      this.debounceTimer = setTimeout(() => {
        this.autoEvaluate();
      }, 1000); // 1秒延迟
    },
    
    // 自动评估（带延迟）
    autoEvaluate() {
      // 检查1秒内是否有键盘输入
      if (Date.now() - this.lastKeyPressTime < 1000) {
        // 如果1秒内有按键，重新设置定时器
        this.debounceTimer = setTimeout(() => {
          this.autoEvaluate();
        }, 1000);
        return;
      }
      
      // 只有当输入内容发生变化时才执行
      if (this.calcInput !== this.lastExecutedInput) {
        this.evaluateCalc();
      }
    },
    
    // 手动执行计算
    evaluateCalc() {
      // 清除定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      
      // 记录当前输入状态
      this.lastExecutedInput = this.calcInput;
      
      if (!this.calcInput.trim()) {
        this.calcOutput = '请输入表达式';
        return;
      }
      
      // 重置变量和输出
      const localVariables = { ...this.variables };
      const localFunctions = { ...this.functions };
      const lines = this.calcInput.split('\n').filter(line => line.trim());
      const results = [];
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        try {
          // 检查是否为 JavaScript 函数定义
          if (line.startsWith('function ')) {
            const funcInfo = this.parseFunctionDefinition(line);
            if (funcInfo) {
              localFunctions[funcInfo.name] = {
                params: funcInfo.params,
                body: funcInfo.body
              };
              results.push(`函数 ${funcInfo.name} 已定义`);
              continue;
            }
          }
          
          // 检查是否为赋值语句 (变量名=表达式)
          const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
          
          if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const expression = assignmentMatch[2];
            
            // 计算表达式的值
            const value = this.evaluateExpression(expression, localVariables, localFunctions);
            localVariables[varName] = value;
            results.push(`${varName} = ${this.formatResult(value)}`);
          } else {
            // 普通表达式
            const result = this.evaluateExpression(line, localVariables, localFunctions);
            results.push(`${line} = ${this.formatResult(result)}`);
          }
        } catch (error) {
          results.push(`${line} → 错误: ${error.message}`);
        }
      }
      
      // 更新变量和函数存储
      this.variables = localVariables;
      this.functions = localFunctions;
      
      // 保存需要持久化的变量和函数到 localStorage
      this.savePersistedVariables();
      this.savePersistedFunctions();
      
      this.calcOutput = results.length > 0 ? results.join('<br>') : '无输出结果';
    },
    
    // 解析 JavaScript 函数定义
    parseFunctionDefinition(funcLine) {
      // 匹配 function functionName(param1, param2) { ... } 格式
      const funcMatch = funcLine.match(/^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const paramsStr = funcMatch[2].trim();
        const params = paramsStr ? paramsStr.split(',').map(p => p.trim()).filter(p => p) : [];
        const body = funcMatch[3].trim();
        
        return {
          name: funcName,
          params: params,
          body: body
        };
      }
      return null;
    },
    
    // 执行函数
    executeFunction(funcName, args, variables, functions) {
      const func = functions[funcName];
      if (!func) {
        throw new Error(`函数 ${funcName} 未定义`);
      }
      
      try {
        // 创建函数参数字符串
        const paramStr = func.params.join(', ');
        
        // 构造完整的函数字符串
        const functionString = `function(${paramStr}) { ${func.body} }`;
        
        // 使用 Function 构造器创建函数
        const funcConstructor = new Function('return ' + functionString);
        const funcExecutor = funcConstructor();
        
        // 执行函数并返回结果
        const result = funcExecutor(...args);
        
        return result;
      } catch (error) {
        throw new Error(`执行函数 ${funcName} 时出错: ${error.message}`);
      }
    },
    
    evaluateExpression(expression, variables, functions) {
      // 处理函数调用
      let processedExpression = expression;
      
      // 处理函数调用 (functionName(arg1, arg2, ...))
      const functionCallRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;
      const matches = [...processedExpression.matchAll(functionCallRegex)];
      
      // 从右到左处理函数调用，避免索引变化问题
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const fullMatch = match[0];
        const funcName = match[1];
        const argsStr = match[2];
        
        if (functions[funcName]) {
          try {
            const args = argsStr.trim() ? argsStr.split(',').map(arg => {
              const trimmedArg = arg.trim();
              try {
                // 递归计算参数值
                return this.evaluateExpression(trimmedArg, variables, functions);
              } catch {
                return trimmedArg;
              }
            }) : [];
            
            const funcResult = this.executeFunction(funcName, args, variables, functions);
            processedExpression = processedExpression.substring(0, match.index) + 
                               `(${funcResult})` + 
                               processedExpression.substring(match.index + fullMatch.length);
          } catch (error) {
            throw new Error(`调用函数 ${funcName} 时出错: ${error.message}`);
          }
        }
      }
      
      // 替换变量名为实际值
      const sortedVarNames = Object.keys(variables).sort((a, b) => b.length - a.length);
      
      for (const varName of sortedVarNames) {
        const varValue = variables[varName];
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, `(${varValue})`);
      }
      
      // 安全的数学表达式求值
      return this.evaluateSimpleExpression(processedExpression);
    },
    
    evaluateSimpleExpression(expression) {
      // 只允许安全的数学运算
      const allowedChars = /^[0-9+\-*/().\s<>=!&|?:%]+$/;
      if (!allowedChars.test(expression.replace(/[()]/g, ''))) {
        throw new Error('包含不安全的字符');
      }
      
      // 处理特殊情况
      if (expression.trim() === '') {
        throw new Error('表达式为空');
      }
      
      // 使用 Function 构造器替代 eval，更安全
      try {
        const result = new Function('return ' + expression)();
        
        // 检查结果是否有效
        if (result === undefined || result === null) {
          throw new Error('表达式无返回值');
        }
        
        return result;
      } catch (error) {
        throw new Error('表达式无效: ' + error.message);
      }
    },
    
    formatResult(value) {
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return value.toString();
        } else {
          return parseFloat(value.toFixed(10)).toString();
        }
      }
      return String(value);
    },
    
    // 切换变量持久化状态
    toggleVariablePersistence(varName) {
      const index = this.persistedVariables.indexOf(varName);
      if (index > -1) {
        // 如果已存在，则移除
        this.persistedVariables.splice(index, 1);
      } else {
        // 如果不存在，则添加
        this.persistedVariables.push(varName);
      }
      this.savePersistedVariables();
    },
    
    // 切换函数持久化状态
    toggleFunctionPersistence(funcName) {
      const index = this.persistedFunctions.indexOf(funcName);
      if (index > -1) {
        // 如果已存在，则移除
        this.persistedFunctions.splice(index, 1);
      } else {
        // 如果不存在，则添加
        this.persistedFunctions.push(funcName);
      }
      this.savePersistedFunctions();
    },
    
    // 保存需要持久化的变量到 localStorage
    savePersistedVariables() {
      const persistedData = {
        names: this.persistedVariables,
        values: {}
      };
      
      // 只保存勾选的变量
      this.persistedVariables.forEach(name => {
        if (this.variables.hasOwnProperty(name)) {
          persistedData.values[name] = this.variables[name];
        }
      });
      
      if (this.persistedVariables.length > 0) {
        localStorage.setItem('calculator-persisted-variables', JSON.stringify(persistedData));
      } else {
        localStorage.removeItem('calculator-persisted-variables');
      }
    },
    
    // 保存需要持久化的函数到 localStorage
    savePersistedFunctions() {
      const persistedData = {
        names: this.persistedFunctions,
        values: {}
      };
      
      // 只保存勾选的函数
      this.persistedFunctions.forEach(name => {
        if (this.functions.hasOwnProperty(name)) {
          persistedData.values[name] = this.functions[name];
        }
      });
      
      if (this.persistedFunctions.length > 0) {
        localStorage.setItem('calculator-persisted-functions', JSON.stringify(persistedData));
      } else {
        localStorage.removeItem('calculator-persisted-functions');
      }
    }
  }
});
</script>

<style scoped>
.calculator-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.input-section,
.output-section {
  position: absolute;
  top: 0;
  height: 85%;
  padding: 20px;
  box-sizing: border-box;
}

.input-section {
  left: 0;
  width: 50%;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.output-section {
  right: 0;
  width: 50%;
}

.txt {
  width: 100%;
  height: 100%;
  margin: 0;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
  resize: none;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  padding: 15px;
  box-sizing: border-box;
  background-color: #f9f9f9;
}

.txt:focus {
  outline: none;
  border-color: #45a049;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.res {
  width: 100%;
  height: 100%;
  margin: 0;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
  resize: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  box-sizing: border-box;
  background-color: #f0f8ff;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.variables-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 15%;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  padding: 10px 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

.variables-panel h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.variable-item, .function-item {
  display: inline-block;
  margin-bottom: 5px;
}

.variable-checkbox, .function-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 13px;
  font-family: 'Consolas', monospace;
  transition: background-color 0.2s;
}

.variable-checkbox {
  background-color: #e8f5e8;
}

.variable-checkbox:hover {
  background-color: #d1e7d1;
}

.function-checkbox {
  background-color: #e3f2fd;
}

.function-checkbox:hover {
  background-color: #bbdefb;
}

.variable-checkbox input[type="checkbox"],
.function-checkbox input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.variable-content, .function-content {
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calculator-container {
    height: 500px;
  }
  
  .input-section,
  .output-section {
    position: relative;
    width: 100%;
    height: 40%;
  }
  
  .variables-panel {
    height: 20%;
  }
}
</style>