/**
 * 动态表单配置接口定义
 */

// 表单组件类型枚举
export type FormComponentType
  = | 'input' // 输入框
    | 'textarea' // 文本域
    | 'password' // 密码框
    | 'select' // 选择器
    | 'radio' // 单选框组
    | 'checkbox' // 多选框组
    | 'switch' // 开关
    | 'number' // 数字输入框
    | 'date' // 日期选择器
    | 'datetime' // 日期时间选择器
    | 'time' // 时间选择器

// 表单选项接口
export interface FormOption {
  label: string
  value: any
  disabled?: boolean
}

// 动态表单配置项接口
export interface DynamicFormConfig {
  field: string // 字段名
  type: FormComponentType // 组件类型
  label: string // 标签文本
  placeholder?: string // 占位符
  required?: boolean // 是否必填
  disabled?: boolean // 是否禁用
  readonly?: boolean // 是否只读
  maxlength?: number // 最大长度
  min?: number // 最小值（数字输入框）
  max?: number // 最大值（数字输入框）
  step?: number // 步长（数字输入框）
  precision?: number // 精度（数字输入框）
  options?: FormOption[] // 选项列表（选择器、单选框、多选框）
  multiple?: boolean // 是否多选（选择器）
  defaultValue?: any // 默认值
  rules?: any[] // 自定义验证规则
  props?: Record<string, any> // 额外属性
  style?: Record<string, any> // 自定义样式
  class?: string // CSS类名
  span?: number // 栅格占位（1-24）
  tooltip?: string // 提示信息
}

// 动态表单数据接口
export interface DynamicFormData {
  [key: string]: any
}

// 后端返回的表单配置格式示例
export interface BackendFormConfig {
  fields?: DynamicFormConfig[]
}

// 表单验证结果接口
export interface FormValidationResult {
  valid: boolean
  errors?: Record<string, string[]>
}

// 表单提交数据接口
export interface FormSubmitData {
  id?: string | number
  payment_channel_id?: string | number
  name: string
  inherit_config: boolean
  rate: number
  min_amount?: number | null
  max_amount?: number | null
  daily_limit?: number | null
  earliest_time?: string | null
  latest_time?: string | null
  status: boolean
  remark?: string
  config: DynamicFormData
}
