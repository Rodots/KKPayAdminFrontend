<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

/**
 * 条件显示配置
 * @description 用于配置字段的条件显示规则
 */
export interface ShowWhenCondition {
  /** 依赖的字段名 */
  field: string
  /** 匹配的值，支持单个值或值数组（数组表示 OR 关系） */
  value: any | any[]
}

export interface DynamicFormConfig {
  field: string
  type: 'input' | 'textarea' | 'password' | 'select' | 'radio' | 'checkbox' | 'switch' | 'number' | 'date' | 'datetime' | 'time'
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  maxlength?: number
  min?: number
  max?: number
  step?: number
  precision?: number
  options?: Array<{ label: string, value: any, disabled?: boolean }>
  multiple?: boolean
  defaultValue?: any
  rules?: any[]
  props?: Record<string, any>
  style?: Record<string, any>
  class?: string
  span?: number
  tooltip?: string
  showWhen?: ShowWhenCondition
}

export interface Props {
  modelValue: Record<string, any>
  config: DynamicFormConfig[]
  notes?: string
  loading?: boolean
  labelWidth?: string
  labelSuffix?: string
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(
  defineProps<Props>(),
  {
    notes: '',
    loading: false,
    labelWidth: '121px',
    labelSuffix: '：',
    disabled: false,
    readonly: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')

// 自动初始化表单数据，包含默认值处理
const formData = computed({
  get: () => {
    // 确保所有配置项都有对应的表单数据
    const currentData = { ...props.modelValue }

    props.config.forEach((item) => {
      if (item.field && !(item.field in currentData)) {
        // 如果字段不存在，使用默认值或根据类型设置合适的默认值
        currentData[item.field] = getDefaultValue(item)
      }
    })

    return currentData
  },
  set: value => emit('update:modelValue', value),
})

// 根据组件类型和配置获取默认值
function getDefaultValue(item: DynamicFormConfig): any {
  if (item.defaultValue !== undefined) {
    return item.defaultValue
  }

  switch (item.type) {
    case 'input':
    case 'textarea':
    case 'password':
      return ''
    case 'select':
    case 'radio':
      return item.multiple ? [] : ''
    case 'checkbox':
      return []
    case 'switch':
      return false
    case 'number':
      return undefined
    case 'date':
    case 'datetime':
    case 'time':
      return null
    default:
      return ''
  }
}

/**
 * 判断字段是否应该显示
 * @param item 表单配置项
 * @returns 是否显示
 */
function isFieldVisible(item: DynamicFormConfig): boolean {
  // 如果没有配置 showWhen，始终显示
  if (!item.showWhen) {
    return true
  }

  const { field, value } = item.showWhen
  const currentValue = formData.value[field]

  // 如果 value 是数组，检查当前值是否在数组中（OR 关系）
  if (Array.isArray(value)) {
    return value.includes(currentValue)
  }

  // 单个值直接比较
  return currentValue === value
}

// 动态生成表单验证规则（只对可见字段生效）
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  props.config.forEach((item) => {
    // 跳过不可见的字段，不生成验证规则
    if (!item.field || !isFieldVisible(item)) {
      return
    }

    const fieldRules: any[] = []

    // 必填验证
    if (item.required) {
      fieldRules.push({
        required: true,
        message: `请${getInputPrefix(item.type)}${item.label}`,
        trigger: getValidationTrigger(item.type),
      })
    }

    // 类型验证
    if (item.type === 'number') {
      fieldRules.push({
        type: 'number',
        message: `${item.label}必须是数字`,
        trigger: 'blur',
      })
    }

    // 长度验证
    if (item.maxlength && ['input', 'textarea', 'password'].includes(item.type)) {
      fieldRules.push({
        max: item.maxlength,
        message: `${item.label}长度不能超过${item.maxlength}位`,
        trigger: 'blur',
      })
    }

    // 数值范围验证
    if (item.type === 'number') {
      if (item.min !== undefined) {
        fieldRules.push({
          validator: (_rule: any, value: any, callback: any) => {
            if (value !== null && value !== undefined && value < item.min!) {
              callback(new Error(`${item.label}不能小于${item.min}`))
            }
            else {
              callback()
            }
          },
          trigger: 'blur',
        })
      }
      if (item.max !== undefined) {
        fieldRules.push({
          validator: (_rule: any, value: any, callback: any) => {
            if (value !== null && value !== undefined && value > item.max!) {
              callback(new Error(`${item.label}不能大于${item.max}`))
            }
            else {
              callback()
            }
          },
          trigger: 'blur',
        })
      }
    }

    // 自定义验证规则
    if (item.rules && Array.isArray(item.rules)) {
      fieldRules.push(...item.rules)
    }

    if (fieldRules.length > 0) {
      rules[item.field] = fieldRules
    }
  })

  return rules
})

// 使用配置项
const formConfig = computed(() => props.config)

// 获取输入提示前缀
function getInputPrefix(type: string): string {
  switch (type) {
    case 'select':
    case 'radio':
      return '选择'
    case 'checkbox':
      return '选择'
    case 'switch':
      return '设置'
    case 'date':
    case 'datetime':
    case 'time':
      return '选择'
    default:
      return '输入'
  }
}

// 获取验证触发方式
function getValidationTrigger(type: string): string {
  switch (type) {
    case 'select':
    case 'radio':
    case 'checkbox':
    case 'switch':
    case 'date':
    case 'datetime':
    case 'time':
      return 'change'
    default:
      return 'blur'
  }
}

// 更新表单数据
function updateFormData(field: string, value: any) {
  const newData = { ...formData.value }
  newData[field] = value
  formData.value = newData
}

// 生成唯一ID
function generateFieldId(field: string): string {
  return `dynamic-form-${field}`
}

// 暴露验证方法
defineExpose({
  validate() {
    return new Promise<boolean>((resolve) => {
      if (!formRef.value) {
        resolve(true)
        return
      }
      formRef.value.validate((valid) => {
        resolve(valid)
      })
    })
  },
  resetFields() {
    formRef.value?.resetFields()
  },
  clearValidate() {
    formRef.value?.clearValidate()
  },
})
</script>

<template>
  <div v-loading="loading" class="dynamic-form">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="labelWidth"
      :label-suffix="labelSuffix"
      :disabled="disabled"
    >
      <ElRow :gutter="20">
        <template v-for="item in formConfig" :key="item.field">
          <ElCol v-if="isFieldVisible(item)" :md="item.span || 24">
            <ElFormItem
              :label="item.label"
              :prop="item.field"
            >
              <template v-if="item.tooltip" #label>
                <span>{{ item.label }}</span>
                <ElTooltip :content="item.tooltip" placement="top">
                  <ElIcon class="text-gray-400">
                    <span class="text-xs">?</span>
                  </ElIcon>
                </ElTooltip>
              </template>

              <!-- 输入框 -->
              <ElInput
                v-if="item.type === 'input'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || ''"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :maxlength="item.maxlength"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 文本域 -->
              <ElInput
                v-else-if="item.type === 'textarea'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || ''"
                :name="item.field"
                type="textarea"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :maxlength="item.maxlength"
                :rows="4"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 密码输入框 -->
              <ElInput
                v-else-if="item.type === 'password'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || ''"
                :name="item.field"
                type="password"
                show-password
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :maxlength="item.maxlength"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 数字输入框 -->
              <ElInputNumber
                v-else-if="item.type === 'number'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] ?? undefined"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :min="item.min"
                :max="item.max"
                :step="item.step || 1"
                :precision="item.precision"
                :style="{ width: '100%', ...item.style }"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 选择器 -->
              <ElSelect
                v-else-if="item.type === 'select'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field]"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :multiple="item.multiple"
                :style="{ width: '100%', ...item.style }"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              >
                <ElOption
                  v-for="option in item.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                  :disabled="option.disabled"
                />
              </ElSelect>

              <!-- 单选按钮组 -->
              <ElRadioGroup
                v-else-if="item.type === 'radio'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field]"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              >
                <ElRadio
                  v-for="option in item.options"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.label }}
                </ElRadio>
              </ElRadioGroup>

              <!-- 复选框组 -->
              <ElCheckboxGroup
                v-else-if="item.type === 'checkbox'"
                :model-value="formData[item.field] || []"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              >
                <ElCheckbox
                  v-for="option in item.options"
                  :id="`${generateFieldId(item.field)}-${option.value}`"
                  :key="option.value"
                  :name="item.field"
                  :value="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.label }}
                </ElCheckbox>
              </ElCheckboxGroup>

              <!-- 开关 -->
              <ElSwitch
                v-else-if="item.type === 'switch'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] ?? false"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, Boolean(value))"
              />

              <!-- 日期选择器 -->
              <ElDatePicker
                v-else-if="item.type === 'date'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || null"
                :name="item.field"
                type="date"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                value-format="YYYY-MM-DD"
                :style="{ width: '100%', ...item.style }"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 日期时间选择器 -->
              <ElDatePicker
                v-else-if="item.type === 'datetime'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || null"
                :name="item.field"
                type="datetime"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                value-format="YYYY-MM-DD HH:mm:ss"
                :style="{ width: '100%', ...item.style }"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 时间选择器 -->
              <ElTimePicker
                v-else-if="item.type === 'time'"
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || null"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                value-format="HH:mm:ss"
                :style="{ width: '100%', ...item.style }"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />

              <!-- 默认输入框 -->
              <ElInput
                v-else
                :id="generateFieldId(item.field)"
                :model-value="formData[item.field] || ''"
                :name="item.field"
                :disabled="disabled || readonly || item.disabled || item.readonly"
                :placeholder="item.placeholder"
                :style="item.style"
                :class="item.class"
                v-bind="item.props"
                @update:model-value="(value) => updateFormData(item.field, value)"
              />
            </ElFormItem>
          </ElCol>
        </template>
      </ElRow>

      <!-- 空状态 -->
      <div v-if="config.length === 0 && !loading" class="empty-config">
        <ElEmpty description="暂无配置项" />
      </div>
    </ElForm>
    <FaSpotlightCard>
      <div v-if="props.notes" class="p-6" v-html="props.notes" />
    </FaSpotlightCard>
  </div>
</template>

<style scoped>
.dynamic-form {
  .empty-config {
    padding: 40px 0;
    text-align: center;
  }
}
</style>
