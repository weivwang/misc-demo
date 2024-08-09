# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## 代码规范
### 命名规范
1. 数字，字符串尽量使用常量命名，且常量声明应当位于循环体外，避免大量声明。
2. 变量命名遵循驼峰命名，一眼可以看出变量意思，减少不必要的注释
3. 涉及到比较复杂的计算部分，尽量注释说明为什么这样计算

### 程序简化
1. 遵循高内聚，低耦合的原则。
2. 尽量保证一个函数只完成一件事情，如果掺杂其他逻辑，应该把这些逻辑尽量抽出，保证单个函数的行数不超过50行。
3. 公共方法和公共常量 都统一放在utils 目录下

### git规范
1. 开发应当以一个feature或一个bug为单位。开发之前，保证工作区干净，先执行git pull，再进行开发；开发之后，及时commit push
2. commit message规范。以feat: xxx 或 bugfix: xxx 或 merge: xxxx , 分别代表新特性开发，修复bug，合并操作

### 组件规范
1. 随着软件功能越来越多，后续的组件也会变多，组件应当在commponents下面新建文件，再进行文件引入。