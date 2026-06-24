<script setup lang="ts">
/**
 * UUID 生成工具
 * 支持 v1 / v3 / v4 / v5 / v6 / v7 各版本生成
 */
import { v1, v3, v4, v5, v6, v7, validate as validateUuid } from 'uuid'

// ===================== 类型和常量 =====================

type UUIDVersion = 'v1' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7'

interface VersionOption {
  label: string
  value: UUIDVersion
  description: string
}

const versionOptions: VersionOption[] = [
  { label: 'v1', value: 'v1', description: '基于时间戳和 MAC 地址' },
  { label: 'v3', value: 'v3', description: '基于命名空间和名称（MD5）' },
  { label: 'v4', value: 'v4', description: '基于随机数（最常用）' },
  { label: 'v5', value: 'v5', description: '基于命名空间和名称（SHA-1）' },
  { label: 'v6', value: 'v6', description: '基于时间戳（v1 改进，按时间排序）' },
  { label: 'v7', value: 'v7', description: '基于 Unix 时间戳（推荐用于数据库主键）' }
]

// 预定义命名空间
const predefinedNamespaces = [
  { label: 'DNS', value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'URL', value: '6ba7b811-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'OID', value: '6ba7b812-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'X500', value: '6ba7b814-9dad-11d1-80b4-00c04fd430c8' },
  { label: '自定义', value: '' }
]

const selectedVersion = ref<UUIDVersion>('v4')
const count = ref(1)
const uppercase = ref(false)
const noHyphens = ref(false)
const output = ref('')
const error = ref('')

// v3/v5 命名空间选择
const namespace = ref(predefinedNamespaces[0]!.value)
// 自定义名称
const nameInput = ref('')

// 是否需要命名空间和名称输入
const needsNamespace = computed(() =>
  selectedVersion.value === 'v3' || selectedVersion.value === 'v5'
)

function selectNamespace(ns: string) {
  namespace.value = ns
}

function generateSingle(): string {
  switch (selectedVersion.value) {
    case 'v1':
      return v1()
    case 'v3':
      return v3(nameInput.value, namespace.value)
    case 'v4':
      return v4()
    case 'v5':
      return v5(nameInput.value, namespace.value)
    case 'v6':
      return v6()
    case 'v7':
      return v7()
    default:
      return v4()
  }
}

function formatUUID(uuid: string): string {
  let result = uuid
  if (noHyphens.value) {
    result = result.replace(/-/g, '')
  }
  if (uppercase.value) {
    result = result.toUpperCase()
  }
  return result
}

function generate() {
  error.value = ''
  // v3/v5 校验
  if (needsNamespace.value) {
    if (!namespace.value) {
      output.value = ''
      error.value = '请输入或选择命名空间'
      return
    }
    if (!validateUuid(namespace.value)) {
      output.value = ''
      error.value = '命名空间必须是有效的 UUID'
      return
    }
    if (!nameInput.value) {
      output.value = ''
      error.value = '请输入名称'
      return
    }
  }

  const num = Math.max(1, Math.min(count.value || 1, 500))
  const results: string[] = []
  for (let i = 0; i < num; i++) {
    results.push(formatUUID(generateSingle()))
  }
  output.value = results.join('\n')
}

function clear() {
  output.value = ''
  error.value = ''
}

// 初始化生成一个
onMounted(() => {
  generate()
})
</script>

<template>
  <div>
    <!-- 版本说明 -->
    <Note
      title="UUID（通用唯一标识符）：128 位标识符，各版本适用不同场景"
      class="mb-4"
    />

    <!-- 版本选择 -->
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-muted">UUID 版本</label>
        <SegmentControl
          v-model="selectedVersion"
          :options="versionOptions.map(v => ({ label: v.label, value: v.value }))"
        />
      </div>
      <p class="text-xs text-dimmed">
        {{ versionOptions.find(v => v.value === selectedVersion)?.description }}
      </p>
    </div>

    <!-- v3/v5 命名空间和名称 -->
    <Transition name="fade">
      <div
        v-if="needsNamespace"
        class="flex flex-col gap-2 p-4 rounded-lg border border-default bg-elevated/50 mb-4"
      >
        <div class="flex flex-col gap-2">
          <div class="text-sm font-medium text-muted">
            命名空间
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="ns in predefinedNamespaces"
              :key="ns.label"
              :variant="namespace === ns.value ? 'solid' : 'outline'"
              :color="namespace === ns.value ? 'primary' : 'neutral'"
              @click="selectNamespace(ns.value)"
            >
              {{ ns.label }}
            </UButton>
          </div>
          <!-- 自定义命名空间输入 -->
          <UInput
            v-model="namespace"
            placeholder="输入自定义命名空间（UUID 格式）"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">名称</label>
          <UInput
            v-model="nameInput"
            placeholder="输入名称，如：example.com"
          />
        </div>
      </div>
    </Transition>

    <!-- 选项 -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm text-muted">数量</label>
        <UInput
          v-model.number="count"
          type="number"
          :min="1"
          :max="500"
          class="min-w-20"
        />
      </div>

      <UCheckbox
        v-model="uppercase"
        label="大写"
      />

      <UCheckbox
        v-model="noHyphens"
        label="无连字符"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <UButton
        icon="lucide:play"
        color="success"
        @click="generate"
      >
        生成
      </UButton>

      <UButton
        variant="ghost"
        color="error"
        icon="lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>

      <Copy :text="output" />
    </div>
    <p
      v-if="error"
      class="text-sm text-error mb-4"
    >
      {{ error }}
    </p>

    <!-- 输出 -->
    <UTextarea
      v-model="output"
      :rows="Math.min(Math.max(count, 3), 20)"
      placeholder="生成结果"
      readonly
      class="w-full"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease, padding 0.25s ease, margin 0.25s ease;
  overflow: hidden;
  max-height: 300px; /* 设置一个足够大的最大高度 */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
