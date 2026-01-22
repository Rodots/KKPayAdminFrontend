<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus'
import api from '@/api/modules/merchant'
import { useFaModal } from '@/ui/components/FaModal'

type EncryptionMode = 'open' | 'only_xxh' | 'only_sha3' | 'only_sm3' | 'only_rsa2'

interface EncryptionDetail {
  merchant_number: string
  mode: EncryptionMode
  mode_text: string
  hash_key: string
  aes_key: string
  rsa2_key: string
}

const props = defineProps<{ id: number | string }>()
const emit = defineEmits<{ success: [] }>()

const loading = ref(false)
const detail = ref<EncryptionDetail | null>(null)
const { copy, copied, text } = useClipboard()

// 编辑表单
const form = ref({
  mode: 'only_sha3' as EncryptionMode,
  hash_key: '',
  aes_key: '',
})

const modeOptions: { value: EncryptionMode, label: string, desc: string }[] = [
  { value: 'open', label: '不限制 (混合模式)', desc: '(兼容) 允许并自动识别所有签名' },
  { value: 'only_xxh', label: 'XXH128 摘要算法', desc: '(性能) 弱校验场景首选，速度最快' },
  { value: 'only_sha3', label: 'SHA3-256 摘要算法', desc: '(通用) NIST国际标准算法，通用性强' },
  { value: 'only_sm3', label: 'SM3 摘要算法', desc: '(国密) 符合国家信创规范，政企可选' },
  { value: 'only_rsa2', label: 'RSA2 数字签名', desc: '【推荐】(安全) 非对称密钥签名，防篡改' },
]

// 生成随机密钥
function generateRandomKey(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// 下载私钥文件
function downloadPrivateKey(merchantNumber: string, privateKey: string) {
  const blob = new Blob([privateKey], { type: 'application/x-pem-file' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${merchantNumber}_rsa2_private.key`
  a.click()
  URL.revokeObjectURL(a.href)
}

// 获取详情
async function fetchDetail() {
  loading.value = true
  try {
    const res = await api.encryptionDetail(props.id) as any
    detail.value = res.data
    form.value.mode = res.data.mode
    form.value.hash_key = ''
    form.value.aes_key = ''
  }
  catch {
    detail.value = null
  }
  finally {
    loading.value = false
  }
}

// 提交修改
async function submit() {
  if (!detail.value) {
    return Promise.reject(new Error('未加载详情'))
  }
  await api.encryptionEdit({
    id: props.id,
    mode: form.value.mode,
    ...(form.value.hash_key && { hash_key: form.value.hash_key }),
    ...(form.value.aes_key && { aes_key: form.value.aes_key }),
  })
  emit('success')
  await fetchDetail()
}

// 生成 RSA2 密钥对
function onGenerateRsa2() {
  if (!detail.value) {
    return
  }
  const merchantNumber = detail.value.merchant_number

  useFaModal().confirm({
    title: '生成 RSA2 密钥对',
    content: '确认生成新的【RSA2 密钥对】吗？原有密钥将被立即替换。',
    onConfirm: () => api.encryptionGenerateRsa2(props.id).then((res: any) => {
      const { private_key } = res.data

      // 创建密钥展示弹窗
      const { open: openKeyModal } = useFaModal().create({
        title: '🔐 RSA2 密钥生成成功',
        class: '!max-w-180',
        footer: false,
        closeOnClickOverlay: false,
        content: () => h('div', { class: 'space-y-5 py-2' }, [
          // 警告横幅
          h('div', { class: 'flex items-center gap-3 rounded-lg border-2 border-dashed border-red-200 bg-red-50 p-4' }, [
            h('div', { class: 'h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500' }, [
              h('span', { class: 'i-ri:error-warning-fill text-2xl' }),
            ]),
            h('div', [
              h('p', { class: 'text-base font-bold text-red-700' }, '私钥仅此一次展示！'),
              h('p', { class: 'text-sm text-red-600/80' }, '将私钥发给商户完成对接，关闭此窗口后将无法再次获取，请立即下载并妥善保存。'),
            ]),
          ]),

          // 私钥区域
          h('div', { class: 'rounded-xl border border-amber-100 bg-amber-50/30 p-4' }, [
            h('div', { class: 'mb-2.5 flex items-center justify-between' }, [
              h('div', { class: 'flex items-center gap-2' }, [
                h('span', { class: 'i-ri:key-2-line text-amber-600' }),
                h('span', { class: 'text-sm font-bold text-amber-900' }, '商户私钥 (Private Key)'),
              ]),
              h('div', { class: 'flex gap-3' }, [
                h(ElButton, {
                  size: 'small',
                  type: 'warning',
                  link: true,
                  onClick: () => copy(private_key),
                }, () => [
                  h('span', { class: (copied.value && text.value === private_key) ? 'i-ri:check-line mr-1' : 'i-ri:file-copy-2-line mr-1' }),
                  (copied.value && text.value === private_key) ? '已复制' : '复制',
                ]),
              ]),
            ]),
            h(ElInput, {
              modelValue: private_key,
              type: 'textarea',
              rows: 10,
              readonly: true,
              resize: 'none',
            }),
            h('div', { class: 'mt-3 border-t border-amber-100/50 pt-3' }, [
              h(ElButton, {
                class: 'w-full',
                type: 'warning',
                onClick: () => downloadPrivateKey(merchantNumber, private_key),
              }, () => [
                h('span', { class: 'i-ri:download-cloud-2-line mr-2' }),
                '下载私钥文件 (.key)',
              ]),
            ]),
          ]),
        ]),
      })
      openKeyModal()
      fetchDetail()
    }),
  })
}

onMounted(fetchDetail)

defineExpose({ submit })
</script>

<template>
  <div v-loading="loading">
    <template v-if="detail">
      <!-- 密钥展示 -->
      <div class="mb-6 space-y-3">
        <ElInput :model-value="detail.hash_key" readonly class="font-mono">
          <template #prepend>
            <div class="w-20 text-center">
              摘要算法密钥
            </div>
          </template>
          <template #append>
            <ElButton @click="copy(detail.hash_key)">
              <template #icon>
                <div :class="copied && text === detail.hash_key ? 'i-ri:check-line text-green-500' : 'i-ri:file-copy-2-line'" />
              </template>
            </ElButton>
          </template>
        </ElInput>

        <ElInput v-if="detail.aes_key" :model-value="detail.aes_key" readonly class="font-mono">
          <template #prepend>
            <div class="w-20 text-center">
              AES 加密密钥
            </div>
          </template>
          <template #append>
            <ElButton @click="copy(detail.aes_key)">
              <template #icon>
                <div :class="copied && text === detail.aes_key ? 'i-ri:check-line text-green-500' : 'i-ri:file-copy-2-line'" />
              </template>
            </ElButton>
          </template>
        </ElInput>

        <ElInput v-if="detail.rsa2_key" :model-value="detail.rsa2_key" readonly class="font-mono">
          <template #prepend>
            <div class="w-20 text-center">
              RSA2 公钥
            </div>
          </template>
          <template #append>
            <ElButton @click="copy(detail.rsa2_key)">
              <template #icon>
                <div :class="copied && text === detail.rsa2_key ? 'i-ri:check-line text-green-500' : 'i-ri:file-copy-2-line'" />
              </template>
            </ElButton>
          </template>
        </ElInput>
      </div>

      <div class="my-3 h-px bg-gray-100" />

      <!-- 配置修改 -->
      <div class="space-y-5">
        <h3 class="text-sm text-gray-900 font-bold">
          配置修改
        </h3>

        <div>
          <label class="mb-1.5 block text-sm text-gray-700">对接签名模式</label>
          <ElSelect v-model="form.mode" class="w-full">
            <ElOption v-for="opt in modeOptions" :key="opt.value" :value="opt.value" :label="opt.label">
              <div class="w-full flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span>{{ opt.label }}</span>
                  <div v-if="opt.value === detail.mode" class="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500 font-medium leading-none">
                    当前生效
                  </div>
                </div>
                <span class="text-xs text-gray-400">{{ opt.desc }}</span>
              </div>
            </ElOption>
          </ElSelect>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1.5 block text-sm text-gray-700">摘要算法密钥 <span class="ml-1 text-xs text-gray-400 font-normal">(留空不改)</span></label>
            <div class="flex gap-2">
              <ElInput v-model="form.hash_key" placeholder="输入或生成，32位字符" class="font-mono">
                <template #append>
                  <ElButton plain @click="form.hash_key = generateRandomKey()">
                    生成
                  </ElButton>
                </template>
              </ElInput>
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm text-gray-700">AES 加密密钥 <span class="ml-1 text-xs text-gray-400 font-normal">(留空不改)</span></label>
            <div class="flex gap-2">
              <ElInput v-model="form.aes_key" placeholder="输入或生成，32位字符" class="font-mono">
                <template #append>
                  <ElButton plain @click="form.aes_key = generateRandomKey()">
                    生成
                  </ElButton>
                </template>
              </ElInput>
            </div>
          </div>
        </div>

        <!-- RSA2 操作 -->
        <div class="pt-2">
          <div class="flex items-center justify-between border border-orange-100 rounded bg-orange-50 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 flex flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                <span class="i-ri:key-2-line text-orange-500" />
              </div>
              <div class="text-sm">
                <div class="text-gray-900 font-bold">
                  RSA2 密钥对（推荐）
                </div>
                <div class="mt-0.5 text-xs text-gray-500">
                  生成新密钥将立即替换原有配置，建议提前与商户交接，避免掉单
                </div>
              </div>
            </div>
            <ElButton type="warning" plain size="small" @click="onGenerateRsa2">
              生成/重置密钥对
            </ElButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
