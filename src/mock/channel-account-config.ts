import { faker } from '@faker-js/faker'
import { defineFakeRoute } from 'vite-plugin-fake-server/client'

export default defineFakeRoute([
  // 获取支付通道子账户配置表单
  {
    url: '/mock/paymentChannelAccount/configForm',
    method: 'get',
    response: ({ query }: any) => {
      const channelId = query.channel_id

      // 根据不同的通道ID返回不同的配置
      let config = []

      switch (channelId) {
        case '1': // 支付宝通道
          config = [
            {
              field: 'app_id',
              type: 'input',
              label: 'AppID',
              placeholder: '请输入支付宝AppID',
              required: true,
              maxlength: 32,
              span: 12,
            },
            {
              field: 'app_private_key',
              type: 'textarea',
              label: '应用私钥',
              placeholder: '请输入应用私钥',
              required: true,
              maxlength: 2048,
              span: 24,
            },
            {
              field: 'alipay_public_key',
              type: 'textarea',
              label: '支付宝公钥',
              placeholder: '请输入支付宝公钥',
              required: true,
              maxlength: 2048,
              span: 24,
            },
            {
              field: 'sign_type',
              type: 'select',
              label: '签名方式',
              required: true,
              span: 12,
              options: [
                { label: 'RSA2', value: 'RSA2' },
                { label: 'RSA', value: 'RSA' },
              ],
              defaultValue: 'RSA2',
            },
            {
              field: 'format',
              type: 'select',
              label: '数据格式',
              required: true,
              span: 12,
              options: [
                { label: 'JSON', value: 'json' },
                { label: 'XML', value: 'xml' },
              ],
              defaultValue: 'json',
            },
            {
              field: 'charset',
              type: 'select',
              label: '字符编码',
              required: true,
              span: 12,
              options: [
                { label: 'UTF-8', value: 'utf-8' },
                { label: 'GBK', value: 'gbk' },
              ],
              defaultValue: 'utf-8',
            },
            {
              field: 'sandbox_mode',
              type: 'switch',
              label: '沙箱模式',
              span: 12,
              defaultValue: false,
              tooltip: '开启后将使用支付宝沙箱环境进行测试',
            },
          ]
          break

        case '2': // 微信支付通道
          config = [
            {
              field: 'app_id',
              type: 'input',
              label: '微信AppID',
              placeholder: '请输入微信AppID',
              required: true,
              maxlength: 32,
              span: 12,
            },
            {
              field: 'mch_id',
              type: 'input',
              label: '商户号',
              placeholder: '请输入微信支付商户号',
              required: true,
              maxlength: 32,
              span: 12,
            },
            {
              field: 'api_key',
              type: 'password',
              label: 'API密钥',
              placeholder: '请输入API密钥',
              required: true,
              maxlength: 32,
              span: 24,
            },
            {
              field: 'api_cert',
              type: 'textarea',
              label: 'API证书',
              placeholder: '请粘贴API证书内容',
              required: false,
              maxlength: 4096,
              span: 24,
            },
            {
              field: 'api_key_cert',
              type: 'textarea',
              label: 'API密钥证书',
              placeholder: '请粘贴API密钥证书内容',
              required: false,
              maxlength: 4096,
              span: 24,
            },
            {
              field: 'payment_types',
              type: 'checkbox',
              label: '支付类型',
              required: true,
              span: 24,
              options: [
                { label: 'JSAPI支付', value: 'jsapi' },
                { label: 'Native支付', value: 'native' },
                { label: 'App支付', value: 'app' },
                { label: 'H5支付', value: 'h5' },
                { label: '小程序支付', value: 'miniprogram' },
              ],
              defaultValue: ['jsapi', 'native'],
            },
            {
              field: 'sandbox_mode',
              type: 'switch',
              label: '沙箱模式',
              span: 12,
              defaultValue: false,
            },
          ]
          break

        case '3': // 银联支付通道
          config = [
            {
              field: 'mer_id',
              type: 'input',
              label: '商户号',
              placeholder: '请输入银联商户号',
              required: true,
              maxlength: 15,
              span: 12,
            },
            {
              field: 'access_type',
              type: 'select',
              label: '接入方式',
              required: true,
              span: 12,
              options: [
                { label: '收单机构接入', value: '0' },
                { label: '商户直连接入', value: '1' },
              ],
              defaultValue: '0',
            },
            {
              field: 'cert_id',
              type: 'input',
              label: '证书ID',
              placeholder: '请输入证书ID',
              required: true,
              maxlength: 40,
              span: 24,
            },
            {
              field: 'private_key',
              type: 'textarea',
              label: '私钥',
              placeholder: '请输入私钥内容',
              required: true,
              maxlength: 4096,
              span: 24,
            },
            {
              field: 'public_key',
              type: 'textarea',
              label: '公钥',
              placeholder: '请输入公钥内容',
              required: true,
              maxlength: 4096,
              span: 24,
            },
            {
              field: 'test_mode',
              type: 'switch',
              label: '测试模式',
              span: 12,
              defaultValue: false,
            },
          ]
          break

        default: // 默认通用配置
          config = [
            {
              field: 'api_endpoint',
              type: 'input',
              label: 'API接口地址',
              placeholder: '请输入API接口地址',
              required: true,
              maxlength: 255,
              span: 24,
            },
            {
              field: 'api_key',
              type: 'input',
              label: 'API密钥',
              placeholder: '请输入API密钥',
              required: true,
              maxlength: 128,
              span: 12,
            },
            {
              field: 'api_secret',
              type: 'password',
              label: 'API密钥',
              placeholder: '请输入API密钥',
              required: true,
              maxlength: 128,
              span: 12,
            },
            {
              field: 'timeout',
              type: 'number',
              label: '超时时间(秒)',
              placeholder: '请输入超时时间',
              required: true,
              min: 1,
              max: 300,
              step: 1,
              span: 12,
              defaultValue: 30,
            },
            {
              field: 'retry_times',
              type: 'number',
              label: '重试次数',
              placeholder: '请输入重试次数',
              required: false,
              min: 0,
              max: 5,
              step: 1,
              span: 12,
              defaultValue: 3,
            },
            {
              field: 'enable_log',
              type: 'switch',
              label: '启用日志',
              span: 12,
              defaultValue: true,
              tooltip: '开启后将记录所有API调用日志',
            },
            {
              field: 'log_level',
              type: 'select',
              label: '日志级别',
              span: 12,
              options: [
                { label: 'DEBUG', value: 'debug' },
                { label: 'INFO', value: 'info' },
                { label: 'WARN', value: 'warn' },
                { label: 'ERROR', value: 'error' },
              ],
              defaultValue: 'info',
            },
            {
              field: 'webhook_url',
              type: 'input',
              label: '回调地址',
              placeholder: '请输入回调地址',
              required: false,
              maxlength: 255,
              span: 24,
            },
            {
              field: 'webhook_secret',
              type: 'password',
              label: '回调密钥',
              placeholder: '请输入回调密钥',
              required: false,
              maxlength: 64,
              span: 24,
            },
            {
              field: 'custom_fields',
              type: 'textarea',
              label: '自定义字段',
              placeholder: '请输入自定义字段配置（JSON格式）',
              required: false,
              maxlength: 1000,
              span: 24,
            },
          ]
      }

      return {
        error: '',
        status: 1,
        data: config,
      }
    },
  },

  // 获取支付通道子账户详情（包含配置数据）
  {
    url: '/mock/paymentChannelAccount/detail',
    method: 'get',
    response: ({ query }: any) => {
      const id = query.id

      // 使用faker生成模拟数据
      const details: Record<string, any> = {
        1: {
          id: 1,
          payment_channel_id: 1,
          name: `${faker.company.name()}支付宝账户`,
          rate: faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 2 }),
          min_amount: 0.01,
          max_amount: 50000,
          daily_limit: 100000,
          earliest_time: '00:00',
          latest_time: '23:59',
          status: 1,
          remark: '支付宝测试账户配置',
          updated_at: faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
          config: {
            app_id: faker.string.alphanumeric(16),
            app_private_key: `-----BEGIN RSA PRIVATE KEY-----\n${faker.string.alphanumeric(1024)}\n-----END RSA PRIVATE KEY-----`,
            alipay_public_key: `-----BEGIN PUBLIC KEY-----\n${faker.string.alphanumeric(512)}\n-----END PUBLIC KEY-----`,
            sign_type: 'RSA2',
            format: 'json',
            charset: 'utf-8',
            sandbox_mode: true,
          },
        },
        2: {
          id: 2,
          payment_channel_id: 2,
          name: `${faker.company.name()}微信支付账户`,
          rate: faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 2 }),
          min_amount: 0.01,
          max_amount: 50000,
          daily_limit: 100000,
          earliest_time: '08:00',
          latest_time: '22:00',
          status: 1,
          remark: '微信支付测试账户配置',
          updated_at: faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
          config: {
            app_id: `wx${faker.string.alphanumeric(16)}`,
            mch_id: faker.string.numeric(10),
            api_key: faker.string.alphanumeric(32),
            api_cert: `-----BEGIN CERTIFICATE-----\n${faker.string.alphanumeric(1024)}\n-----END CERTIFICATE-----`,
            api_key_cert: `-----BEGIN PRIVATE KEY-----\n${faker.string.alphanumeric(1024)}\n-----END PRIVATE KEY-----`,
            payment_types: ['jsapi', 'native', 'h5'],
            sandbox_mode: true,
          },
        },
      }

      const detail = details[id] || {
        id: Number(id),
        payment_channel_id: 1,
        name: `${faker.company.name()}测试账户`,
        rate: faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 2 }),
        min_amount: null,
        max_amount: null,
        daily_limit: null,
        earliest_time: null,
        latest_time: null,
        status: 1,
        remark: '',
        updated_at: faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
        config: {
          api_endpoint: faker.internet.url(),
          api_key: faker.string.alphanumeric(32),
          api_secret: faker.string.alphanumeric(32),
          timeout: 30,
          retry_times: 3,
          enable_log: true,
          log_level: 'info',
          webhook_url: faker.internet.url(),
          webhook_secret: faker.string.alphanumeric(16),
          custom_fields: JSON.stringify({
            field1: faker.lorem.word(),
            field2: faker.lorem.word(),
          }),
        },
      }

      return {
        error: '',
        status: 1,
        data: detail,
      }
    },
  },
])
