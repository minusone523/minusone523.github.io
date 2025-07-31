<template>
  <!-- Calculator Component -->
  <div class="calculator-container">
    <div class="input-section">
      <textarea
        class="txt"
        v-model="calcInput"
        @input="onInput"
        @keydown.ctrl.enter="evaluateCalc"
        @keydown.enter="evaluateCalc"
        @keydown.meta.enter="evaluateCalc"
        placeholder="支持变量和函数定义：&#10;&#10;变量: x=5&#10;&#10;函数: function add(x, y) { return x + y; }&#10;&#10;调用: add(1, 2)&#10;&#10;数组/对象访问: arr[0], obj.prop&#10;&#10;Ctrl+Enter 执行计算"
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
            <span class="variable-content">{{ name }} = {{ formatResult(value) }}</span>
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
    // --- 修改点1: 使用具名方法并过滤按键 ---
    document.addEventListener('keydown', this.handleGlobalKeyDown);
    // --- 修改结束 ---
  },
  beforeUnmount() {
    // 组件销毁前清除定时器和事件监听
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    // --- 修改点2: 移除监听器时使用相同的方法名 ---
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
    // --- 修改结束 ---
  },
  methods: {
    // --- 新增方法: 过滤并处理全局按键事件 ---
    handleGlobalKeyDown(event) {
      // 忽略仅由控制键、功能键、方向键、Tab、Enter等触发的事件
      const key = event.key;
      const ignoredKeys = [
        'Control', 'Alt', 'AltGraph', 'Shift', 'Meta', // 修饰键
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', // 方向键
        'Enter', 'NumpadEnter', 'Tab', 'CapsLock', 'Escape', // 特殊功能键
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', // F键
        'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', // 编辑/导航键
        'ScrollLock', 'Pause', 'ContextMenu', // 其他系统键
        // 可以选择性地忽略 'Backspace', 'Delete'
      ];

      // 如果按键在忽略列表中，则不更新 lastKeyPressTime
      if (ignoredKeys.includes(key)) {
        return;
      }

      // 对于所有其他按键（包括字母、数字、符号、空格、Backspace, Delete 等），更新时间
      this.lastKeyPressTime = Date.now();
    },
    // --- 新增方法结束 ---


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
      // --- 修改点3: 简化或移除 lastKeyPressTime 检查 ---
      // 由于 handleGlobalKeyDown 已经过滤了不需要的按键，
      // 这个检查可能不再严格需要，但保留作为保险。
      // 如果移除，请确保只依赖 debounceTimer 逻辑。
      // 检查1秒内是否有键盘输入 (这个检查可能不再需要，取决于 handleKeyPress 的过滤效果)
      // if (Date.now() - this.lastKeyPressTime < 1000) {
      //   // 如果1秒内有按键，重新设置定时器
      //   this.debounceTimer = setTimeout(() => {
      //     this.autoEvaluate();
      //   }, 1000);
      //   return;
      // }
      // --- 修改结束 ---

      // 只有当输入内容发生变化时才执行
      if (this.calcInput !== this.lastExecutedInput) {
        this.evaluateCalc();
      }
    },
    // 手动执行计算 (Ctrl+Enter)
    evaluateCalc() {
      // --- 修改点4: 确保清除定时器并更新状态 ---
      // 清除定时器，防止 autoEvaluate 紧接着触发
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null; // 重置定时器引用
      }
      if (this.lastExecutedInput.trim() == this.calcInput.trim()) {
        return;
      }
      // 记录当前输入状态，防止 autoEvaluate 重复执行相同内容
      this.lastExecutedInput = this.calcInput;
      console.log("run execute");
      // --- 修改结束 ---

      if (!this.calcInput.trim()) {
        this.calcOutput = '请输入表达式';
        return;
      }

      // 重置局部变量和输出，不影响全局状态直到计算成功
      const localVariables = { ...this.variables };
      const localFunctions = { ...this.functions };
      const processedInput = this.calcInput.trim().replace(/\\\s*\n\s*/g, ' ');
      const lines = processedInput.split('\n').filter(line => line.trim());
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
          const assignmentMatch = line.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/);
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

      // 只有在所有行都成功处理后才更新全局状态
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
      // 使用 [\s\S]* 来匹配包括换行符在内的任意字符
      const funcMatch = funcLine.match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/);
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
    // 执行函数 (已修改以支持函数体内的复杂语法，如 for, while, if)
    executeFunction(funcName, args, variables, functions) {
      const func = functions[funcName];
      if (!func) {
        throw new Error(`函数 ${funcName} 未定义`);
      }
      try {
        // 1. 准备函数执行所需的所有上下文
        //    a. 外部变量 (variables)
        const varNames = Object.keys(variables);
        const varValues = varNames.map(name => variables[name]);
        
        //    b. 外部函数 (functions) - 需要重新构造为可执行的函数对象
        const funcNames = Object.keys(functions);
        const funcValues = funcNames.map(name => {
            const f = functions[name];
            try {
                const pStr = f.params.join(', ');
                // 重新动态创建函数对象
                const fString = `function ${name}(${pStr}) { ${f.body} }`;
                return new Function('return ' + fString)();
            } catch(e) {
                console.error(`重新创建函数 ${name} 时出错:`, e);
                // 返回一个抛错的函数，防止中断主流程
                return () => { throw new Error(`函数 ${name} 内部错误`); };
            }
        });

        //    c. 当前函数的参数名和值
        //    d. 合并所有名称和值，作为动态函数的参数
        const allParamNamesForFunc = [...varNames, ...funcNames, ...func.params];
        const allParamValuesForFunc = [...varValues, ...funcValues, ...args];

        // 2. 使用 Function 构造器创建函数执行器
        //    - 参数名包括：外部变量名、外部函数名、当前函数参数名
        //    - 函数体就是用户定义的 func.body
        const funcExecutor = new Function(...allParamNamesForFunc, func.body);
        
        // 3. 调用函数执行器，并传入对应的值
        //    这使得 func.body 内部可以访问到 variables, functions, 和 arguments
        const result = funcExecutor(...allParamValuesForFunc);
        return result;

      } catch (error) {
        throw new Error(`执行函数 ${funcName} 时出错: ${error.message}`);
      }
    },
    // 评估表达式，支持变量和函数调用
    // --- 修改点5: 重构 evaluateExpression 和 evaluateSimpleExpression 以支持 x[0], x.prop ---
    evaluateExpression(expression, variables, functions) {
        // 处理函数调用 (functionName(arg1, arg2, ...))
        // 这个逻辑保持不变，因为它在替换表达式之前处理
        let processedExpression = expression;
        const functionCallRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g;
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
                            // 如果参数计算失败，可能它本身就是值或变量名
                            // 在新的 evaluateSimpleExpression 中会处理
                            return trimmedArg;
                        }
                    }) : [];
                    const funcResult = this.executeFunction(funcName, args, variables, functions);
                    processedExpression = processedExpression.substring(0, match.index) + 
                                        `(${JSON.stringify(funcResult)})` + // 使用 JSON.stringify 确保结果是有效的 JS 字面量
                                        processedExpression.substring(match.index + fullMatch.length);
                } catch (error) {
                    throw new Error(`调用函数 ${funcName} 时出错: ${error.message}`);
                }
            }
        }

        // 将变量和函数作为上下文传递给 evaluateSimpleExpression
        return this.evaluateSimpleExpression(processedExpression, variables, functions);
    },
    // 安全的数学表达式求值，使用变量上下文
    evaluateSimpleExpression(expression, variables = {}, functions = {}) {
        // 处理特殊情况
        if (expression.trim() === '') {
            throw new Error('表达式为空');
        }

        // 准备变量和函数作为 Function 构造函数的参数
        const varNames = Object.keys(variables);
        const varValues = varNames.map(name => variables[name]);
        // 函数名也作为变量传入，其值是函数对象
        const funcNames = Object.keys(functions);
        const funcValues = funcNames.map(name => {
            const func = functions[name];
            try {
                // 重新构造函数对象
                const paramStr = func.params.join(', ');
                const funcString = `function ${name}(${paramStr}) { ${func.body} }`;
                return new Function('return ' + funcString)();
            } catch(e) {
                console.error(`创建函数 ${name} 时出错:`, e);
                return () => { throw new Error(`函数 ${name} 内部错误`); };
            }
        });

        // 合并所有名称和值
        const allNames = [...varNames, ...funcNames];
        const allValues = [...varValues, ...funcValues];

        try {
            // 使用 Function 构造器，将变量和函数作为参数传入
            const func = new Function(...allNames, `return (${expression});`);
            const result = func(...allValues);
            // 检查结果是否有效
            if (result === undefined || result === null) {
                // 注意：某些表达式（如赋值 var a = 1;）可能返回 undefined，但这在计算器上下文中可能不适用
                // 或者我们只关心有返回值的表达式
                // 这里暂时保留原逻辑，但可以考虑更严格的检查
                // throw new Error('表达式无返回值');
            }
            return result;
        } catch (error) {
            throw new Error('表达式无效: ' + error.message);
        }
    },
    // --- 修改结束 ---
    formatResult(value) {
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return value.toString();
        } else {
          return parseFloat(value.toFixed(10)).toString();
        }
      } else if (typeof value === 'object' && value !== null) {
        // --- 修改点6: 使 JSON 输出为单行 ---
        // 如果值是对象且不为 null，则尝试将其转换为格式化的 JSON 字符串
        try {
          // var result = JSON.stringify(value, null, 2); // <- 原来的多行格式
          var result = JSON.stringify(value); // <- 改为单行格式
          if (result == '' || result == '{}' || result == '[]') {
            result = "[object] keys=[" + Object.getOwnPropertyNames(value) + "]";
          }
          return result;
        } catch (error) {
          // 如果对象包含循环引用等无法序列化的情况，则回退到 toString
          return String(value);
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