<template>
  <div class="tools-container">
    <h2>常用工具集</h2>
    
    <div class="tools-grid">
      <!-- 时间转换工具 -->
      <div class="tool-card">
        <h3>时间转换</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>时间戳转时间：</label>
            <a-input v-model:value="time.timestamp" placeholder="输入时间戳" />
            <div class="radio-group">
              单位：
              <a-radio-group v-model:value="time.unit">
                <a-radio value="1">秒</a-radio>
                <a-radio value="1000">毫秒</a-radio>
              </a-radio-group>
            </div>
            <div class="result">结果：{{ timestampToTime }}</div>
          </div>
          
          <div class="tool-section">
            <label>时间转时间戳：</label>
            <a-date-picker 
              v-model:value="time.date" 
              show-time 
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择日期时间"
            />
            <div class="result">
              秒：{{ timeToTimestampSec }}<br>
              毫秒：{{ timeToTimestampMs }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- URL 编码解码工具 -->
      <div class="tool-card">
        <h3>URL 编码解码</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>URL 编码：</label>
            <a-textarea 
              v-model:value="urlEncode.input" 
              placeholder="输入要编码的文本"
              :rows="3"
            />
            <a-button @click="doURLEncode" type="primary" size="small">编码</a-button>
            <div class="result">{{ urlEncode.output }}</div>
          </div>
          
          <div class="tool-section">
            <label>URL 解码：</label>
            <a-textarea 
              v-model:value="urlDecode.input" 
              placeholder="输入要解码的URL"
              :rows="3"
            />
            <a-button @click="doURLDecode" type="primary" size="small">解码</a-button>
            <div class="result">{{ urlDecode.output }}</div>
          </div>
        </div>
      </div>
      
      <!-- Base64 编码解码工具 -->
      <div class="tool-card">
        <h3>Base64 编码解码</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>Base64 编码：</label>
            <a-textarea 
              v-model:value="base64Encode.input" 
              placeholder="输入要编码的文本"
              :rows="3"
            />
            <a-button @click="doBase64Encode" type="primary" size="small">编码</a-button>
            <div class="result">{{ base64Encode.output }}</div>
          </div>
          
          <div class="tool-section">
            <label>Base64 解码：</label>
            <a-textarea 
              v-model:value="base64Decode.input" 
              placeholder="输入要解码的Base64字符串"
              :rows="3"
            />
            <a-button @click="doBase64Decode" type="primary" size="small">解码</a-button>
            <div class="result">{{ base64Decode.output }}</div>
          </div>
        </div>
      </div>
      
      <!-- 字符串处理工具 -->
      <div class="tool-card">
        <h3>字符串处理</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>文本处理：</label>
            <a-textarea 
              v-model:value="stringProcess.input" 
              placeholder="输入文本"
              :rows="3"
            />
            <div class="button-group">
              <a-button @click="toUpperCase" size="small">转大写</a-button>
              <a-button @click="toLowerCase" size="small">转小写</a-button>
              <a-button @click="trimText" size="small">去除空格</a-button>
              <a-button @click="countChars" size="small">统计字符</a-button>
            </div>
            <div class="result">{{ stringProcess.output }}</div>
          </div>
        </div>
      </div>
      
      <!-- 进制转换工具 -->
      <div class="tool-card">
        <h3>进制转换</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>十进制：</label>
            <a-input v-model:value="numberConvert.dec" @input="convertFromDec" placeholder="输入十进制数" />
          </div>
          <div class="tool-section">
            <label>二进制：</label>
            <a-input v-model:value="numberConvert.bin" @input="convertFromBin" placeholder="输入二进制数" />
          </div>
          <div class="tool-section">
            <label>八进制：</label>
            <a-input v-model:value="numberConvert.oct" @input="convertFromOct" placeholder="输入八进制数" />
          </div>
          <div class="tool-section">
            <label>十六进制：</label>
            <a-input v-model:value="numberConvert.hex" @input="convertFromHex" placeholder="输入十六进制数" />
          </div>
        </div>
      </div>
      
      <!-- Hash 计算工具 -->
      <div class="tool-card">
        <h3>Hash 计算</h3>
        <div class="tool-content">
          <div class="tool-section">
            <label>文本 Hash：</label>
            <a-textarea 
              v-model:value="hash.input" 
              placeholder="输入文本"
              :rows="3"
            />
            <div class="button-group">
              <a-button @click="calculateMD5" size="small">MD5</a-button>
              <a-button @click="calculateSHA1" size="small">SHA1</a-button>
              <a-button @click="calculateSHA256" size="small">SHA256</a-button>
            </div>
            <div class="result">{{ hash.output }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import moment from 'moment';
import CryptoJS from 'crypto-js';

export default defineComponent({
  name: 'ToolsView',
  data() {
    return {
      time: {
        timestamp: (new Date()).getTime(),
        unit: 1000,
        date: moment()
      },
      urlEncode: {
        input: '',
        output: ''
      },
      urlDecode: {
        input: '',
        output: ''
      },
      base64Encode: {
        input: '',
        output: ''
      },
      base64Decode: {
        input: '',
        output: ''
      },
      stringProcess: {
        input: '',
        output: ''
      },
      numberConvert: {
        dec: '',
        bin: '',
        oct: '',
        hex: ''
      },
      hash: {
        input: '',
        output: ''
      }
    };
  },
  computed: {
    timestampToTime() {
      if (!this.time.timestamp) return '';
      try {
        return moment(parseInt(this.time.timestamp / parseInt(this.time.unit)) * 1000).local().format("YYYY-MM-DD HH:mm:ss");
      } catch (e) {
        return '无效时间戳';
      }
    },
    timeToTimestampSec() {
      if (!this.time.date) return '';
      return Math.floor(this.time.date.valueOf() / 1000);
    },
    timeToTimestampMs() {
      if (!this.time.date) return '';
      return this.time.date.valueOf();
    }
  },
  methods: {
    // URL 编码
    doURLEncode() {
      try {
        this.urlEncode.output = encodeURIComponent(this.urlEncode.input);
      } catch (e) {
        this.urlEncode.output = '编码失败：' + e.message;
      }
    },
    
    // URL 解码
    doURLDecode() {
      try {
        this.urlDecode.output = decodeURIComponent(this.urlDecode.input);
      } catch (e) {
        this.urlDecode.output = '解码失败：' + e.message;
      }
    },
    
    // Base64 编码
    doBase64Encode() {
      try {
        this.base64Encode.output = btoa(unescape(encodeURIComponent(this.base64Encode.input)));
      } catch (e) {
        this.base64Encode.output = '编码失败：' + e.message;
      }
    },
    
    // Base64 解码
    doBase64Decode() {
      try {
        this.base64Decode.output = decodeURIComponent(escape(atob(this.base64Decode.input)));
      } catch (e) {
        this.base64Decode.output = '解码失败：' + e.message;
      }
    },
    
    // 字符串转大写
    toUpperCase() {
      this.stringProcess.output = this.stringProcess.input.toUpperCase();
    },
    
    // 字符串转小写
    toLowerCase() {
      this.stringProcess.output = this.stringProcess.input.toLowerCase();
    },
    
    // 去除空格
    trimText() {
      this.stringProcess.output = this.stringProcess.input.trim();
    },
    
    // 统计字符
    countChars() {
      const text = this.stringProcess.input;
      this.stringProcess.output = `字符数: ${text.length}, 字节数: ${new Blob([text]).size}`;
    },
    
    // 进制转换
    convertFromDec() {
      if (this.numberConvert.dec === '') {
        this.clearNumberConvert();
        return;
      }
      try {
        const num = parseInt(this.numberConvert.dec);
        if (!isNaN(num)) {
          this.numberConvert.bin = num.toString(2);
          this.numberConvert.oct = num.toString(8);
          this.numberConvert.hex = num.toString(16).toUpperCase();
        }
      } catch (e) {
        this.clearNumberConvert();
      }
    },
    
    convertFromBin() {
      if (this.numberConvert.bin === '') {
        this.clearNumberConvert();
        return;
      }
      try {
        const num = parseInt(this.numberConvert.bin, 2);
        if (!isNaN(num)) {
          this.numberConvert.dec = num.toString();
          this.numberConvert.oct = num.toString(8);
          this.numberConvert.hex = num.toString(16).toUpperCase();
        }
      } catch (e) {
        this.clearNumberConvert();
      }
    },
    
    convertFromOct() {
      if (this.numberConvert.oct === '') {
        this.clearNumberConvert();
        return;
      }
      try {
        const num = parseInt(this.numberConvert.oct, 8);
        if (!isNaN(num)) {
          this.numberConvert.dec = num.toString();
          this.numberConvert.bin = num.toString(2);
          this.numberConvert.hex = num.toString(16).toUpperCase();
        }
      } catch (e) {
        this.clearNumberConvert();
      }
    },
    
    convertFromHex() {
      if (this.numberConvert.hex === '') {
        this.clearNumberConvert();
        return;
      }
      try {
        const num = parseInt(this.numberConvert.hex, 16);
        if (!isNaN(num)) {
          this.numberConvert.dec = num.toString();
          this.numberConvert.bin = num.toString(2);
          this.numberConvert.oct = num.toString(8);
        }
      } catch (e) {
        this.clearNumberConvert();
      }
    },
    
    clearNumberConvert() {
      this.numberConvert.dec = '';
      this.numberConvert.bin = '';
      this.numberConvert.oct = '';
      this.numberConvert.hex = '';
    },
    
    // Hash 计算
    calculateMD5() {
      try {
        this.hash.output = CryptoJS.MD5(this.hash.input).toString();
      } catch (e) {
        this.hash.output = '计算失败：' + e.message;
      }
    },
    
    calculateSHA1() {
      try {
        this.hash.output = CryptoJS.SHA1(this.hash.input).toString();
      } catch (e) {
        this.hash.output = '计算失败：' + e.message;
      }
    },
    
    calculateSHA256() {
      try {
        this.hash.output = CryptoJS.SHA256(this.hash.input).toString();
      } catch (e) {
        this.hash.output = '计算失败：' + e.message;
      }
    }
  },
  created() {
    console.log('ToolsView created');
  }
});
</script>

<style lang="scss" scoped>
.tools-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tools-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.tool-card {
  background: #fff;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tool-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-section label {
  font-weight: bold;
  color: #555;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.result, .error {
  padding: 10px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
}

.result {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

:deep(.ant-input), :deep(.ant-input-number), :deep(.ant-picker) {
  width: 100%;
}

:deep(.ant-textarea) {
  width: 100%;
  resize: vertical;
}

:deep(.ant-btn) {
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .tools-container {
    padding: 10px;
  }
  
  .tool-card {
    padding: 15px;
  }
  
  .tools-grid {
    gap: 15px;
  }
}
</style>