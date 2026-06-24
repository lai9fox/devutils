<script setup lang="ts">
/**
 * 时间戳转换工具
 * Unix 时间戳与日期时间互转
 */
import dayjs from 'dayjs'

type Unit = 'second' | 'millisecond'
const unit = ref<Unit>('second')
const timestamp = ref('')
const date = ref('')
const error = ref('')
const dateFormat = computed(() => unit.value === 'second' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss.SSS')

function timestampToDate() {
  error.value = ''
  const val = timestamp.value.trim()
  if (!val) {
    date.value = ''
    return
  }
  const num = Number(val)
  if (Number.isNaN(num)) {
    date.value = ''
    error.value = '请输入有效的数字'
    return
  }
  const ms = unit.value === 'second' ? num * 1000 : num
  if (ms < -8640000000000000 || ms > 8640000000000000) {
    date.value = ''
    error.value = '时间戳超出有效范围'
    return
  }
  date.value = dayjs(ms).format(dateFormat.value)
}

function dateToTimestamp() {
  error.value = ''
  const val = date.value.trim()
  if (!val) {
    timestamp.value = ''
    return
  }
  const d = dayjs(val)
  if (!d.isValid()) {
    timestamp.value = ''
    error.value = '请输入有效的日期时间，如：2024-01-01 12:00:00'
    return
  }
  const ts = unit.value === 'second' ? Math.floor(d.valueOf() / 1000) : d.valueOf()
  timestamp.value = String(ts)
}

function useNow() {
  if (unit.value === 'second') {
    timestamp.value = String(Math.floor(Date.now() / 1000))
  } else {
    timestamp.value = String(Date.now())
  }
  timestampToDate()
}

function clear() {
  timestamp.value = ''
  date.value = ''
  error.value = ''
}

// 初始化显示当前时间
onMounted(() => {
  useNow()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note
      title="Unix 时间戳表示自 1970-01-01 00:00:00 UTC 起的秒数或毫秒数。"
    />

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">时间单位</label>
      <div class="flex gap-2">
        <SegmentControl
          v-model="unit"
          :options="[
            { label: '秒 (10 位)', value: 'second' },
            { label: '毫秒 (13 位)', value: 'millisecond' }
          ]"
        />
        <UButton
          variant="ghost"
          color="error"
          icon="lucide:trash-2"
          @click="clear"
        >
          清空
        </UButton>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">时间戳</label>
      <div class="flex gap-2">
        <UInput
          v-model="timestamp"
          placeholder="输入时间戳，如 1704067200"
          class="font-mono flex-1"
        />
        <UButton
          icon="lucide:clock"
          variant="outline"
          color="secondary"
          @click="useNow"
        >
          当前
        </UButton>
        <UButton
          icon="lucide:arrow-down"
          color="success"
          @click="timestampToDate"
        >
          转换
        </UButton>
        <Copy :text="timestamp" />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">日期</label>
      <div class="flex gap-2">
        <UInput
          v-model="date"
          placeholder="输入日期，如 2024-01-01 12:00:00"
          class="flex-1"
        />
        <UButton
          icon="lucide:clock"
          variant="outline"
          color="secondary"
          @click="useNow"
        >
          当前
        </UButton>
        <UButton
          icon="lucide:arrow-up"
          color="primary"
          @click="dateToTimestamp"
        >
          转换
        </UButton>
        <Copy :text="date" />
      </div>
    </div>

    <p
      v-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>
  </div>
</template>
