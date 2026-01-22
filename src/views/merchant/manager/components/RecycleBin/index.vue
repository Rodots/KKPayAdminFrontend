<script setup lang="ts">
import { toast } from 'vue-sonner'
import api from '@/api/modules/merchant'
import { useFaModal } from '@/ui/components/FaModal'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const loading = ref(false)
const dataList = ref<any[]>([])

onMounted(getDataList)

function getDataList() {
  loading.value = true
  api.recycleBinList().then((res: any) => {
    dataList.value = res.data.list
  }).catch(() => {
    dataList.value = []
  }).finally(() => {
    loading.value = false
  })
}

function onRestore(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认找回「${row.merchant_number}」商户吗？`,
    onConfirm: () => api.recover({ id: row.id }).then(() => {
      toast.success('找回成功')
      getDataList()
      emit('success')
    }),
  })
}

defineExpose({ getDataList })
</script>

<template>
  <div class="h-150 flex flex-col">
    <ElTable v-loading="loading" :data="dataList" stripe highlight-current-row border height="100%" class="flex-1">
      <ElTableColumn prop="merchant_number" label="商户编号" width="200" />
      <ElTableColumn prop="remark" label="商户备注" min-width="200" show-overflow-tooltip />
      <ElTableColumn prop="deleted_at" label="删除时间" width="165" />
      <ElTableColumn label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton type="primary" size="small" plain @click="onRestore(row)">
            找回
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>
