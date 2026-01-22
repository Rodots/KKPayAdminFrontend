<script setup lang="ts">
import { toast } from 'vue-sonner'
import api from '@/api/modules/admin'
import { useFaModal } from '@/ui/components/FaModal'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import DetailForm from './components/DetailForm/index.vue'
import '@/assets/styles/list.css'

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const formModeProps = ref({ id: '' })

const searchDefault = {
  account: '',
  email: '',
  role: '',
  created_at: '',
  status: '',
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

const batch = ref({
  selectionDataList: [] as any[],
})

onMounted(getDataList)

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.account && { account: search.value.account }),
    ...(search.value.email && { email: search.value.email }),
    ...(search.value.role !== '' && { role: search.value.role }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
    ...(search.value.status !== '' && { status: search.value.status }),
  }
  api.list(params).then((res: any) => {
    dataList.value = res.data.list
    pagination.value.total = res.data.total
  }).catch(() => {
    dataList.value = []
    pagination.value.total = 0
  }).finally(() => {
    loading.value = false
  })
}

const sizeChange = (size: number) => onSizeChange(size).then(getDataList)
const currentChange = (page = 1) => onCurrentChange(page).then(getDataList)
const sortChange = ({ prop, order }: { prop: string, order: string }) => onSortChange(prop, order).then(getDataList)

const formRef = ref<InstanceType<typeof DetailForm>>()

const { open: openModal, update: updateModal } = useFaModal().create({
  destroyOnClose: true,
  closeOnClickOverlay: false,
  closeOnPressEscape: false,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      formRef.value?.submit().then(() => {
        getDataList()
        done()
      })
    }
    else {
      done()
    }
  },
  content: () => h(DetailForm, {
    ref: formRef,
    id: formModeProps.value.id,
  }),
})

function onCreate() {
  formModeProps.value.id = ''
  updateModal({ title: '新增' })
  openModal()
}

function onEdit(row: any) {
  formModeProps.value.id = row.id
  updateModal({ title: '编辑' })
  openModal()
}

function onResetPassword(row: any, type: string) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认将「${row.account}」的${type === 'login' ? '登录' : '资金'}密码重置为 "123456" 吗？`,
    onConfirm: () => api.resetPassword({ id: row.id, type }).then(() => toast.success('重置成功')),
  })
}

function onResetTotp(row: any) {
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认重置「${row.account}」的TOTP（谷歌验证）吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.resetTotp({ id: row.id }).then(() => {
          row.statusLoading = false
          toast.success(`重置成功`)
          resolve(true)
        }).catch(() => {
          row.statusLoading = false
          resolve(false)
        })
      },
    })
  })
}

function onChangeStatus(row: any) {
  const action = !row.status ? '启用' : '禁用'
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认${action}「${row.account}」吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.changeStatus({ id: row.id, status: !row.status }).then(() => {
          row.statusLoading = false
          toast.success(`${action}成功`)
          resolve(true)
        }).catch(() => {
          row.statusLoading = false
          resolve(false)
        })
      },
    })
  })
}

function onBatchChangeStatus(status: 0 | 1) {
  const ids = batch.value.selectionDataList.map((item: any) => item.id)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  const action = status ? '启用' : '禁用'
  useFaModal().confirm({
    title: '确认信息',
    content: `确认${action}所选的 ${ids.length} 个管理员吗？`,
    onConfirm: () => api.batchChangeStatus({ ids, status }).then(() => {
      toast.success(`${action}成功`)
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}

function handleMoreOperating(command: string, row: any) {
  const actions: Record<string, () => void> = {
    resetLoginPassword: () => onResetPassword(row, 'login'),
    resetFundPassword: () => onResetPassword(row, 'fund'),
    resetTotp: () => onResetTotp(row),
  }
  actions[command]?.()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="管理员账号">
              <ElInput v-model="search.account" placeholder="请输入管理员账号" clearable maxlength="32" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="邮箱">
              <ElInput v-model="search.email" placeholder="请输入邮箱，支持模糊查询" clearable maxlength="255" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="角色">
              <ElSelect v-model="search.role" placeholder="请选择角色" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="普通管理员" :value="1" />
                <ElOption label="客服" :value="2" />
                <ElOption label="牛马" :value="255" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-show="!fold" label="创建时间">
              <ElDatePicker v-model="search.created_at" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
            </ElFormItem>
            <ElFormItem label="状态">
              <ElRadioGroup v-model="search.status" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton :value="1">
                  正常
                </ElRadioButton>
                <ElRadioButton :value="0">
                  封禁
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem>
              <ElButton @click="searchReset(); currentChange()">
                重置
              </ElButton>
              <ElButton type="primary" @click="currentChange()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                筛选
              </ElButton>
              <ElButton link @click="toggle">
                <template #icon>
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top'" />
                </template>
                {{ fold ? '展开' : '收起' }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />
      <ElSpace wrap>
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增
        </ElButton>
        <ElButtonGroup>
          <ElButton :disabled="!batch.selectionDataList.length" @click="onBatchChangeStatus(1)">
            批量启用
          </ElButton>
          <ElButton :disabled="!batch.selectionDataList.length" @click="onBatchChangeStatus(0)">
            批量禁用
          </ElButton>
        </ElButtonGroup>
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn type="selection" align="center" fixed />
        <ElTableColumn prop="id" label="ID" width="100" sortable />
        <ElTableColumn prop="role" label="角色" sortable>
          <template #default="{ row }">
            {{ row.role_name }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account" label="账号" />
        <ElTableColumn prop="nickname" label="昵称" />
        <ElTableColumn prop="email" label="邮箱" />
        <ElTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <ElSwitch v-model="row.status" :loading="row.statusLoading" inline-prompt active-text="正常" inactive-text="封禁" :before-change="() => onChangeStatus(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="totp_state" label="TOTP状态" width="100">
          <template #default="{ row }">
            <ElSwitch v-model="row.totp_state" inline-prompt active-text="已设置" inactive-text="未设置" disabled />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="165" />
        <ElTableColumn prop="updated_at" label="更新时间" width="165" />
        <ElTableColumn label="操作" width="200" align="center">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onEdit(row)">
                编辑
              </ElButton>
              <FaAuth :value="['super_admin', 'admin']">
                <ElDropdown @command="handleMoreOperating($event, row)">
                  <ElButton size="small">
                    更多操作
                    <FaIcon name="i-ep:arrow-down" class="el-icon--right" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem command="resetLoginPassword">
                        重置登录密码
                      </ElDropdownItem>
                      <ElDropdownItem command="resetFundPassword">
                        重置资金密码
                      </ElDropdownItem>
                      <ElDropdownItem command="resetTotp">
                        重置TOTP
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </FaAuth>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
