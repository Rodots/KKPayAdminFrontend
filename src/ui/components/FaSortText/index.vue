<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import FaTooltip from '../FaTooltip/index.vue'

defineOptions({
  name: 'FaSortText',
})

const props = withDefaults(
  defineProps<{
    text?: string
    class?: HTMLAttributes['class']
    stringLength?: number
  }>(),
  {
    text: '',
    stringLength: 140,
  },
)

const displayText = computed(() => {
  if (!props.text) {
    return ''
  }
  if (props.text.length <= props.stringLength) {
    return props.text
  }
  return `${props.text.substring(0, props.stringLength)}...`
})

const disabled = computed(() => (props.text?.length ?? 0) <= props.stringLength)
</script>

<template>
  <FaTooltip :text="text" :disabled="disabled">
    <span :class="props.class">{{ displayText }}</span>
  </FaTooltip>
</template>
