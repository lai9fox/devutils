<script setup lang="ts">
/**
 * Cron 表达式解析器
 * 将 cron 表达式翻译为中文自然语言描述，并计算下次执行时间
 */
import dayjs from 'dayjs'

const input = ref('0 9 * * 1-5')
const nextCount = ref(4)

// 常用预设
const presets = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天 0 点', value: '0 0 * * *' },
  { label: '每天 9 点', value: '0 9 * * *' },
  { label: '工作日 9 点', value: '0 9 * * 1-5' },
  { label: '每周一 9 点', value: '0 9 * * 1' },
  { label: '每月 1 号', value: '0 0 1 * *' },
  { label: '每年 1 月 1 日', value: '0 0 1 1 *' }
]

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 解析单个字段：返回匹配的值数组
function parseField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>()

  for (const part of field.split(',')) {
    const trimmed = part.trim()

    // *
    if (trimmed === '*') {
      for (let i = min; i <= max; i++) values.add(i)
      continue
    }

    // */n
    const stepAll = trimmed.match(/^\*\/(\d+)$/)
    if (stepAll) {
      const step = Number.parseInt(stepAll[1]!)
      if (step <= 0) return null
      for (let i = min; i <= max; i += step) values.add(i)
      continue
    }

    // a-b 或 a-b/n
    const range = trimmed.match(/^(\d+)-(\d+)(\/(\d+))?$/)
    if (range) {
      const start = Number.parseInt(range[1]!)
      const end = Number.parseInt(range[2]!)
      const step = range[4] ? Number.parseInt(range[4]) : 1
      if (start < min || end > max || start > end || step <= 0) return null
      for (let i = start; i <= end; i += step) values.add(i)
      continue
    }

    // 纯数字
    if (!/^\d+$/.test(trimmed)) return null
    const num = Number.parseInt(trimmed, 10)
    if (num < min || num > max) return null
    values.add(num)
  }

  return values.size > 0 ? Array.from(values).sort((a, b) => a - b) : null
}

interface ParsedCron {
  minutes: number[]
  hours: number[]
  days: number[]
  months: number[]
  weekdays: number[]
}

function parseCron(expr: string): ParsedCron | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const minutes = parseField(parts[0]!, 0, 59)
  const hours = parseField(parts[1]!, 0, 23)
  const days = parseField(parts[2]!, 1, 31)
  const months = parseField(parts[3]!, 1, 12)
  const weekdays = parseField(parts[4]!, 0, 7) // 0 和 7 都表示周日

  if (!minutes || !hours || !days || !months || !weekdays) return null

  // 标准化：7 => 0（周日）
  const normalizedWeekdays = [...new Set(weekdays.map(d => d === 7 ? 0 : d))].sort((a, b) => a - b)

  return { minutes, hours, days, months, weekdays: normalizedWeekdays }
}

// 解析结果（description + error 统一在一个 computed 中派生，避免 computed 内产生副作用）
const parseResult = computed(() => {
  if (!input.value.trim()) return { description: '', error: '' }

  const cron = parseCron(input.value)
  if (!cron) {
    return { description: '', error: '无效的 Cron 表达式（需要 5 个字段：分 时 日 月 周）' }
  }

  const parts: string[] = []

  // 月
  if (cron.months.length < 12) {
    parts.push(`${cron.months.map(m => monthNames[m]).join('、')}`)
  }

  // 周
  if (cron.weekdays.length < 7) {
    parts.push(`${cron.weekdays.map(d => weekDayNames[d]).join('、')}`)
  }

  // 日
  if (cron.days.length < 31) {
    parts.push(`${cron.days.join('、')} 号`)
  }

  // 时
  if (cron.hours.length === 24 && cron.minutes.length === 60) {
    parts.push('每分钟')
  } else if (cron.hours.length === 24) {
    parts.push(`每小时的第 ${cron.minutes.join('、')} 分钟`)
  } else if (cron.minutes.length === 60) {
    parts.push(`${cron.hours.join('、')} 点的每分钟`)
  } else {
    const timeStrs = []
    for (const h of cron.hours) {
      for (const m of cron.minutes) {
        timeStrs.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      }
    }
    if (timeStrs.length <= 10) {
      parts.push(timeStrs.join('、'))
    } else {
      parts.push(`${cron.hours.join('、')} 点的第 ${cron.minutes.join('、')} 分钟`)
    }
  }

  return { description: parts.join('，') + ' 执行', error: '' }
})

const description = computed(() => parseResult.value.description)
const error = computed(() => parseResult.value.error)

// 计算下 N 次执行时间
function getNextExecutions(expr: string, count: number): string[] {
  const cron = parseCron(expr)
  if (!cron) return []
  const limit = Math.max(1, Math.min(Math.trunc(Number(count) || 4), 20))

  const results: string[] = []
  let current = dayjs().add(1, 'minute').startOf('minute')
  const maxIterations = limit * 525600 // 按需求次数扩大搜索范围（每次至少覆盖一年）

  for (let i = 0; i < maxIterations && results.length < limit; i++) {
    const month = current.month() + 1
    const day = current.date()
    const weekday = current.day()
    const hour = current.hour()
    const minute = current.minute()

    if (
      cron.months.includes(month)
      && cron.days.includes(day)
      && cron.weekdays.includes(weekday)
      && cron.hours.includes(hour)
      && cron.minutes.includes(minute)
    ) {
      results.push(current.format('YYYY-MM-DD HH:mm (ddd)'))
    }

    current = current.add(1, 'minute')
  }

  return results
}

const nextExecutions = computed(() => {
  if (!input.value.trim() || error.value) return []
  return getNextExecutions(input.value, nextCount.value)
})

// 字段说明
const fieldDocs = [
  { field: '分钟', range: '0-59', example: '0, 15, */5' },
  { field: '小时', range: '0-23', example: '0, 9, 9-17' },
  { field: '日期', range: '1-31', example: '1, 15, 1-15' },
  { field: '月份', range: '1-12', example: '1, 6, 1-6' },
  { field: '星期', range: '0-7', example: '0=日, 1-5, 1,3,5' }
]

function applyPreset(value: string) {
  input.value = value
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="标准 5 字段 Cron 格式：分钟 小时 日期 月份 星期。支持 *、逗号、连字符、步长。" />

    <!-- 输入 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">Cron 表达式</label>
      <UInput
        v-model="input"
        placeholder="* * * * *"
        class="font-mono text-lg"
      />
      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>
    </div>

    <!-- 常用预设 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">常用预设</label>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="preset in presets"
          :key="preset.value"
          variant="outline"
          size="sm"
          @click="applyPreset(preset.value)"
        >
          {{ preset.label }}
          <span class="ml-1 font-mono text-xs text-dimmed">{{ preset.value }}</span>
        </UButton>
      </div>
    </div>

    <!-- 自然语言描述 -->
    <div
      v-if="description"
      class="flex flex-col gap-2"
    >
      <label class="text-sm font-medium text-muted">含义</label>
      <div class="rounded-lg border border-primary-500/40 bg-primary-500/5 p-4 text-primary-600 dark:text-primary-400 font-medium">
        {{ description }}
      </div>
    </div>

    <!-- 下次执行时间 -->
    <div
      v-if="nextExecutions.length > 0"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-muted">接下来 {{ nextCount }} 次执行时间</label>
        <UInput
          v-model.number="nextCount"
          type="number"
          :min="1"
          :max="20"
          class="w-16"
          size="sm"
        />
      </div>
      <div class="rounded-lg border border-default bg-elevated overflow-hidden">
        <div
          v-for="(time, idx) in nextExecutions"
          :key="idx"
          class="flex items-center gap-3 px-4 py-2.5 border-b border-default last:border-b-0"
        >
          <span class="text-xs text-dimmed w-6 text-right">{{ idx + 1 }}</span>
          <span class="font-mono text-sm text-default">{{ time }}</span>
        </div>
      </div>
    </div>

    <!-- 字段参考 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">字段参考</label>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-elevated text-muted">
              <th class="px-3 py-2 text-left font-medium">
                字段
              </th>
              <th class="px-3 py-2 text-left font-medium">
                取值范围
              </th>
              <th class="px-3 py-2 text-left font-medium">
                示例
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in fieldDocs"
              :key="doc.field"
              class="border-t border-default"
            >
              <td class="px-3 py-2 font-medium text-default">
                {{ doc.field }}
              </td>
              <td class="px-3 py-2 font-mono text-muted">
                {{ doc.range }}
              </td>
              <td class="px-3 py-2 font-mono text-muted">
                {{ doc.example }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
