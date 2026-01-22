<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

interface Props {
  type: string
  signString?: string
  curlCommand?: string
  jsonBody?: string
  redirectUrl?: string
}

withDefaults(defineProps<Props>(), {
  signString: '',
  curlCommand: '',
  jsonBody: '',
  redirectUrl: '',
})

const { copy, copied } = useClipboard()
const curlVisible = ref(false)
</script>

<template>
  <!-- 服务器异步通知 -->
  <div v-if="type === 'server'" class="flex flex-col gap-4">
    <p class="text-sm text-gray-500 leading-6">
      温馨提示：<br>本次回调请求将在请求头中携带 <b>Notification-SignatureString</b> 参数，其值为本次回调对应的完整签名字符串，用于验证通知请求的合法性。请贵方在接收通知时务必据此正确校验签名。<br>若在对接过程中遇到困难，可提醒商户，以便技术人员协助排查。
    </p>
  </div>

  <!-- 手动异步通知 -->
  <div v-else-if="type === 'manual'" class="flex flex-col gap-4">
    <p class="text-sm text-gray-600">
      已生成cURL命令，您可以通过以下方式调试：
    </p>
    <div class="space-y-3">
      <div class="relative">
        <input :value="curlCommand" readonly class="w-full border rounded-md p-2 pr-10 text-sm font-mono" :title="curlCommand">
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <FaButton variant="ghost" size="icon" class="h-6 w-6 text-gray-500 hover:text-gray-700" @click="copy(curlCommand)">
            <FaIcon :name="copied ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && 'text-green-500']" />
          </FaButton>
        </div>
      </div>
      <div class="flex gap-2">
        <FaButton size="sm" variant="outline" @click="curlVisible = !curlVisible">
          <FaIcon :name="curlVisible ? 'i-ri:eye-close-line' : 'i-ri:eye-line'" class="mr-1" />
          {{ curlVisible ? '隐藏' : '查看' }}请求体
        </FaButton>
      </div>
      <div v-if="curlVisible" class="border rounded-md bg-gray-50 p-3">
        <p class="mb-2 text-sm text-gray-700 font-medium">
          请求头：
        </p>
        <pre class="mb-2 whitespace-pre-wrap break-all text-xs font-mono">Notification-Type: trade_state_sync
Notification-Id: manual
Notification-SignatureString: {{ signString }}</pre>
        <p class="mb-2 text-sm text-gray-700 font-medium">
          请求体JSON<FaButton variant="ghost" size="icon" class="h-6 w-6 text-gray-500 hover:text-gray-700" @click="copy(jsonBody)">
            <FaIcon :name="copied ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && 'text-green-500']" />
          </FaButton>：
        </p>
        <pre class="whitespace-pre-wrap break-all text-xs font-mono">{{ jsonBody }}</pre>
      </div>
    </div>
    <div class="mt-1 text-xs text-gray-500 space-y-1">
      <p>使用说明：</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>复制上方cURL命令到终端直接执行</li>
        <li>或使用Postman等工具导入（选择"Raw text"粘贴）</li>
        <li>或使用在线HTTP工具测试</li>
      </ul>
    </div>
  </div>

  <!-- 同步通知 -->
  <div v-else-if="type === 'sync'" class="flex flex-col gap-4">
    <p class="text-sm text-gray-600">
      您可以复制链接或点击下方按钮快捷跳转：
    </p>
    <div class="relative">
      <input :value="redirectUrl" readonly class="w-full border rounded-md p-2 pr-10 text-sm font-mono" :title="redirectUrl">
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <FaButton variant="ghost" size="icon" class="h-6 w-6 text-gray-500 hover:text-gray-700" @click="copy(redirectUrl)">
          <FaIcon :name="copied ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && 'text-green-500']" />
        </FaButton>
      </div>
    </div>
    <div class="flex gap-2">
      <a :href="redirectUrl" target="_blank">
        <FaInteractiveButton text="点我立即跳转到商户页面" />
      </a>
    </div>
    <div class="mt-1 text-xs text-gray-500">
      <p>注意：此操作将模拟用户支付成功后的页面跳转，注意自身IP地址保护，避免泄露。</p>
    </div>
  </div>
</template>
