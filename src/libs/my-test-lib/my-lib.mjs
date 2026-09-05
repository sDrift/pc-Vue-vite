import { ElButton as m, ElTable as h, ElTableColumn as g } from 'element-plus'
import {
  Fragment as e,
  createBlock as t,
  createCommentVNode as n,
  createElementBlock as r,
  createElementVNode as i,
  createTextVNode as a,
  createVNode as o,
  normalizeClass as s,
  openBlock as c,
  renderList as l,
  renderSlot as u,
  toDisplayString as d,
  unref as f,
  withCtx as p,
} from 'vue'
// #region src/components/MyTable.vue
const _ = {
    __name: 'MyTable',
    props: {
      columns: {
        type: Array,
        required: !0,
      },
      data: {
        type: Array,
        required: !0,
      },
      showActions: {
        type: Boolean,
        default: !1,
      },
    },
    emits: ['edit', 'delete'],
    setup(i, { emit: s }) {
      const u = s,
        d = (e) => u('edit', e),
        _ = (e) => u('delete', e)

      return (s, u) => (
        c(),
        t(
          f(h),
          {
            data: i.data,
            border: '',
            style: { width: '100%' },
          },
          {
            default: p(() => [
              (c(!0),
              r(
                e,
                null,
                l(
                  i.columns,
                  (e) => (
                    c(),
                    t(
                      f(g),
                      {
                        key: e.key,
                        prop: e.key,
                        label: e.title,
                      },
                      null,
                      8,
                      ['prop', 'label'],
                    )
                  ),
                ),
                128,
              )),
              i.showActions
                ? (c(),
                  t(
                    f(g),
                    {
                      key: 0,
                      label: '操作',
                    },
                    {
                      default: p(({ row: e }) => [
                        o(
                          f(m),
                          {
                            type: 'primary',
                            size: 'small',
                            onClick: (t) => d(e),
                          },
                          {
                            default: p(() => [...(u[0] ||= [a(' 编辑 ', -1)])]),
                            _: 1,
                          },
                          8,
                          ['onClick'],
                        ),
                        o(
                          f(m),
                          {
                            type: 'danger',
                            size: 'small',
                            onClick: (t) => _(e),
                          },
                          {
                            default: p(() => [...(u[1] ||= [a(' 删除 ', -1)])]),
                            _: 1,
                          },
                          8,
                          ['onClick'],
                        ),
                      ]),
                      _: 1,
                    },
                  ))
                : n('', !0),
            ]),
            _: 1,
          },
          8,
          ['data'],
        )
      )
    },
  },
  v = { class: 'my-div' },
  y = {
    __name: 'MyButton',
    props: {
      label: {
        type: String,
        default: '按钮',
      },
      type: {
        type: String,
        default: 'primary',
      },
    },
    emits: ['myClickButton'],
    setup(e, { emit: t }) {
      const n = t,
        o = () => {
          ;(console.log('按钮被点击了'), n('myClickButton', '按钮被点击了'))
        }

      return (t, n) => (
        c(),
        r('div', v, [
          i(
            'button',
            {
              type: 'button',
              class: s(['my-button', e.type]),
              onClick: o,
            },
            [u(t.$slots, 'default', {}, () => [a(d(e.label), 1)])],
            2,
          ),
        ])
      )
    },
  },
  b = {
    MyTable: _,
    MyButton: y,
  },
  x = {
    install: (e, t = {}) => {
      Object.entries(b).forEach(([t, n]) => {
        e.component(t, n)
      })
    },
    ...b,
  }

// #endregion
export { y as MyButton, _ as MyTable, x as default }
