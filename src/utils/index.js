// ================================================================
//  1. 配置定义
// ================================================================
/**
 * (a > 5 AND (b < 10 OR (c = 11 AND (d = 6 or f = 7)))and e = 8)
 * a>5 and (b<10 or (c=11 and d=6 and (g=9 and f=7))) or e=8
 */
// ---- 1a. 数组配置（初始版本，含括号标记） ----
const configArray = [
  { key: 'a', value: 5, eq: '大于', lj: 'and', mark: '' },
  { key: 'b', value: 10, eq: '小于', lj: 'or', mark: '（' },
  { key: 'c', value: 11, eq: '等于', lj: 'and', mark: '（' },
  { key: 'd', value: 6, eq: '等于', lj: 'and', mark: '' },
  { key: 'g', value: 9, eq: '等于', lj: 'and', mark: '（' },
  { key: 'f', value: 7, eq: '等于', lj: 'or', mark: '）））' },
  { key: 'e', value: 8, eq: '等于', lj: '', mark: '' },
]

// const minArry = [
//   { key: 'a', value: 10, eq: '小于', lj: 'and', mark: '' },
//   { key: 'b', value: 10, eq: '小于', lj: 'or', mark: '（' },
// ]
// let arr = []
// let arr2 = []
// let arr3 = []
let obj = {}
let objarr = []
const mydata = { a: 8, b: 3, c: 11, d: 6, e: 8, f: 7, g: 9 }
let initlist = []
const getObjByKey = (key) => {
  return initlist.find((t) => t.key === key)
}
const childrenPush = (item) => {
  const f_key = objarr[objarr.length - 1]

  console.log('f_key:', f_key, 'item.key:', item.key, 'item.mark:', item.mark, getObjByKey(f_key))
  getObjByKey(f_key).children = getObjByKey(f_key)?.children || []
  getObjByKey(f_key).children.push(item)
}
const myArrToTree = () => {
  initlist = JSON.parse(JSON.stringify(configArray))
  console.log(initlist)
  // arr = []
  // arr2 = []
  // arr3 = []
  obj = {}
  objarr = []
  initlist.forEach((item, i) => {
    if (item.mark.includes('（')) {
      if (i === 0) {
        obj.children = obj.children || []
        obj.children.push(item)
      } else {
        const f_key = initlist[i - 1].key

        console.log(
          'f_key:',
          f_key,
          'item.key:',
          item.key,
          'item.mark:',
          item.mark,
          getObjByKey(f_key),
        )
        objarr.push(f_key)
        getObjByKey(f_key).children = getObjByKey(f_key)?.children || []
        getObjByKey(f_key).children.push(item)
      }
    } else if (item.mark.includes('）')) {
      const count = (item.mark.match(/）/g) || []).length

      childrenPush(item)
      for (let i = 0; i < count; i++) {
        objarr.pop()
      }
    } else {
      if (i === 0) {
        obj.children = obj.children || []
        obj.children.push(item)
      } else if (item.mark.includes('') && objarr.length === 0) {
        obj.children.push(item)
      } else {
        childrenPush(item)
      }
    }
  })
  console.log('obj:', obj, 'objarr:', objarr)
  // configArray.forEach((item, i) => {
  //     if (item.mark.includes('（')) {
  //         console.log(arr, i, item.key, item.mark, 1)
  //         let key = arr.length > 0 ? arr[arr.length - 1] : arr2[arr2.length - 1]
  //         let obj = configArray.find((t) => {
  //             return t.key === key;
  //         })
  //         obj.children = obj.children || []
  //         obj.children.push(item)
  //         arr.push(item.key)
  //         console.log(arr, i, item.key, item.mark, 2)
  //     } else if (item.mark.includes('）')) {
  //         const count = (item.mark.match(/）/g) || []).length;
  //         let key = arr.length-1 > 0 ? arr[arr.length - 2] : arr2[arr2.length - 1]
  //         let obj = configArray.find((t) => {
  //             return t.key === key;
  //         })
  //         obj.children = obj.children || []
  //         obj.children.push(item)
  //         console.log(arr, i, item.key, item.mark, 1,key)
  //         for (let i = 0; i < count; i++) {
  //             arr.pop()
  //         }
  //         console.log(arr, i, item.key, item.mark, 2)
  //     }
  //     if (arr.length === 0 && !item.mark) {
  //         arr2.push(item.key)
  //     } else if (arr.length > 0 && !item.mark) {
  //         let key = arr.length-1 > 0 ? arr[arr.length - 2] : arr2[arr2.length - 1]
  //         console.log(arr, i, item.key, item.mark, 4)
  //         let obj = configArray.find((t) => {
  //             return t.key === key;
  //         })
  //         obj.children = obj.children || []
  //         obj.children.push(item)
  //     }
  //     console.log(arr, i, item.key, 3)
  //     // console.log('arr:', arr, 'arr2:', arr2)
  // })

  // arr3 = configArray.filter((t) => {
  //     return arr2.includes(t.key);
  // })
  // console.log('arr2:', arr2, 'arr3:', arr3)
  const f = myGetValue(obj.children)

  console.log('最终结果:', f)
}

const getChildLjEnd = (children) => {
  const lastChild = children?.[children.length - 1]

  if (!lastChild) {
    return null
  }

  if (lastChild.children?.length) {
    return getChildLjEnd(lastChild.children)
  }

  if (Array.isArray(lastChild)) {
    return getChildLjEnd(lastChild)
  }

  return lastChild.lj || null
}
// let val2, pendingOp
const myGetValue = (newarr) => {
  let val2 = null
  let pendingOp = null

  newarr.forEach((item) => {
    let val = null

    switch (item.eq) {
      case '大于':
        val = mydata[item.key] > item.value
        break
      case '小于':
        val = mydata[item.key] < item.value
        break
      case '等于':
        val = mydata[item.key] === item.value
        break
      default:
        val = mydata[item.key] === item.value
    }
    if (item.children?.length) {
      if (item.lj === 'and') {
        val = val && myGetValue(item.children)
      } else if (item.lj === 'or') {
        val = val || myGetValue(item.children)
      }
    }
    if (val2 === null) {
      val2 = val
    } else if (pendingOp === 'and') {
      val2 = val2 && val
    } else if (pendingOp === 'or') {
      val2 = val2 || val
    }
    if (item.children?.length) {
      pendingOp = getChildLjEnd(item.children) || null
    } else {
      pendingOp = item.lj || null
    }
  })

  return val2
}
// ---- 1b. 字符串配置（等效） ----
const configString = '(a > 5 AND (b < 10 OR (c = 11 AND d = 6)))'

// ================================================================
//  2. 解析器：数组 → 树（用栈处理括号）
// ================================================================

function buildTree(config) {
  const root = []
  const stack = [root]
  let current = root
  // console.log('构建树结构:', config);

  for (const item of config) {
    // ---- 左括号：新建子节点，入栈 ----
    if (item.mark && item.mark.includes('（')) {
      const count = (item.mark.match(/（/g) || []).length

      console.log('左括号数量:', count)
      for (let i = 0; i < count; i++) {
        const child = []

        current.push(child)
        stack.push(child)
        current = child
      }
    }

    // ---- 条件节点：加入当前栈顶 ----
    if (item.key) {
      current.push({
        key: item.key,
        value: item.value,
        eq: item.eq,
        lj: item.lj || '',
      })
      const arr = JSON.parse(JSON.stringify(current))
      const arr2 = JSON.parse(JSON.stringify(stack))
      const arr3 = JSON.parse(JSON.stringify(root))

      console.log('当前条件节点:', arr, '当前栈:', arr2, '当前树:', arr3)
    }

    // ---- 右括号：连续弹出 ----
    if (item.mark && item.mark.includes('）')) {
      const count = (item.mark.match(/）/g) || []).length

      console.log('右括号数量:', count)
      for (let i = 0; i < count; i++) {
        stack.pop()
        current = stack[stack.length - 1]
      }
    }
  }
  console.log('最终树结构:', root)

  return root
}

// ================================================================
//  3. 求值器：树 → 布尔（递归 + 短路）
// ================================================================

function evaluateTree(tree, data) {
  let result = null
  let pendingOp = null

  // console.log(tree, data);
  // a>4 and (b=2 or c<9) or d=2
  for (const node of tree) {
    let val
    let nodeend = null

    // ---- 子节点（括号组）递归求值 ----
    if (Array.isArray(node)) {
      val = evaluateTree(node, data)
      nodeend = getChildLjEnd(node) || null
    } else {
      // ---- 叶子节点：比较运算 ----
      const actual = data[node.key]

      switch (node.eq) {
        case '大于':
          val = actual > node.value
          break
        case '小于':
          val = actual < node.value
          break
        case '等于':
          val = actual === node.value
          break
        default:
          val = false
      }
    }

    // ---- 短路运算 ----
    if (result === null) {
      result = val
    } else if (pendingOp === 'and') {
      result = result && val
      // if (!result) return false; // AND 短路：遇到 false 立即返回
    } else if (pendingOp === 'or') {
      result = result || val
      // if (result) return true; // OR 短路：遇到 true 立即返回
    }

    pendingOp = nodeend ? nodeend : node.lj || null
  }

  return result
}

// ================================================================
//  4. 字符串 → 数组（用于支持字符串配置）
// ================================================================

function stringToArray(expr) {
  const result = []
  let i = 0

  console.log('解析表达式:', expr)

  while (i < expr.length) {
    const ch = expr[i]

    // 跳过空格
    if (ch === ' ') {
      i++
      continue
    }

    // ---- 左括号（英文或中文） ----
    if (ch === '(' || ch === '（') {
      result.push({ key: '', value: '', eq: '', lj: '', mark: '（' })
      i++
      continue
    }

    // ---- 右括号（英文或中文） ----
    if (ch === ')' || ch === '）') {
      let count = 0

      while (i < expr.length && (expr[i] === ')' || expr[i] === '）')) {
        count++
        i++
      }
      result.push({ key: '', value: '', eq: '', lj: '', mark: '）'.repeat(count) })
      continue
    }

    // ---- 解析字段名（a-z / A-Z） ----
    if (/[a-zA-Z]/.test(ch)) {
      let key = ''

      while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
        key += expr[i]
        i++
      }

      // 跳过空格
      while (i < expr.length && expr[i] === ' ') i++

      // 解析运算符（>, <, =, >=, <=）
      let op = ''

      if (expr.substr(i, 2) === '>=') {
        op = '>='
        i += 2
      } else if (expr.substr(i, 2) === '<=') {
        op = '<='
        i += 2
      } else if (expr[i] === '>') {
        op = '>'
        i++
      } else if (expr[i] === '<') {
        op = '<'
        i++
      } else if (expr[i] === '=') {
        op = '='
        i++
      }

      // 跳过空格
      while (i < expr.length && expr[i] === ' ') i++

      // 解析数值
      let valStr = ''

      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        valStr += expr[i]
        i++
      }
      const value = parseFloat(valStr)

      // 跳过空格，解析逻辑连接符（AND / OR）
      while (i < expr.length && expr[i] === ' ') i++
      let logic = ''

      if (expr.substr(i, 3).toUpperCase() === 'AND') {
        logic = 'and'
        i += 3
      } else if (expr.substr(i, 2).toUpperCase() === 'OR') {
        logic = 'or'
        i += 2
      }

      // 将符号运算符转为中文（与数组配置统一）
      const eqMap = {
        '>': '大于',
        '<': '小于',
        '=': '等于',
        '>=': '大于等于',
        '<=': '小于等于',
      }

      result.push({
        key,
        value,
        eq: eqMap[op] || op,
        lj: logic,
        mark: '',
      })

      continue
    }

    // ---- 跳过其他字符（如逗号等） ----
    i++
  }

  return result
}

// ================================================================
//  5. 统一入口（支持字符串或数组）
// ================================================================

function evaluate(exprOrConfig, data) {
  let config

  if (typeof exprOrConfig === 'string') {
    config = stringToArray(exprOrConfig)
  } else {
    config = exprOrConfig
  }
  const tree = buildTree(config)

  return evaluateTree(tree, data)
}

// ================================================================
//  6. 展示树结构（美化输出）
// ================================================================

function formatTree(tree, indent = 0) {
  const pad = '  '.repeat(indent)
  const lines = []

  for (const node of tree) {
    if (Array.isArray(node)) {
      lines.push(`${pad}[ 括号组 ]`)
      lines.push(...formatTree(node, indent + 1))
    } else {
      const opMap = { 大于: '>', 小于: '<', 等于: '=' }
      const op = opMap[node.eq] || node.eq
      const logic = node.lj ? `  →  ${node.lj.toUpperCase()}` : ''

      lines.push(`${pad}${node.key} ${op} ${node.value}${logic}`)
    }
  }

  return lines
}

// ================================================================
//  7. 运行测试
// ================================================================

const testData = [
  {
    label: 'a=8, b=3, c=11, d=6,e=8,f=7,g=9',
    data: { a: 8, b: 3, c: 11, d: 6, e: 8, f: 7, g: 9 },
    expect: true,
  },
  // { label: 'a=8, b=12, c=11, d=6', data: { a: 8, b: 12, c: 11, d: 6 }, expect: true },
  // { label: 'a=8, b=12, c=5, d=6', data: { a: 8, b: 12, c: 5, d: 6 }, expect: false },
  // { label: 'a=3, b=3, c=11, d=6', data: { a: 3, b: 3, c: 11, d: 6 }, expect: false },
  // { label: 'a=8, b=12, c=11, d=2', data: { a: 8, b: 12, c: 11, d: 2 }, expect: true },
]

export const init = () => {
  // testData.forEach(({ label, data, expect }) => {
  //     const result = evaluate(configArray, data);
  //     const pass = result === expect;
  //     console.log(`测试: ${label} → 结果: ${result} (期望: ${expect}) → ${pass ? '通过' : '失败'}`);
  // });
  myArrToTree()
}
// init();
