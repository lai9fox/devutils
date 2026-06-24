<script setup lang="ts">
/**
 * URL 编解码工具
 * 支持 encodeURI / encodeURIComponent
 */
// 编码类型
enum EncodeType {
  URI = 'URI',
  COMPONENT = 'URIComponent'
}
const encodeType = ref<EncodeType>(EncodeType.COMPONENT)

// 输入
const input = ref('')

// 输出
const output = ref('')
const error = ref('')

function setResult(action: '编码' | '解码', handler: (value: string) => string) {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }

  try {
    output.value = handler(input.value)
  } catch (e) {
    output.value = ''
    error.value = `${action}失败：${(e as Error).message}`
  }
}

// 编码
function encode() {
  setResult('编码', value => encodeType.value === EncodeType.URI ? encodeURI(value) : encodeURIComponent(value))
}

// 解码
function decode() {
  setResult('解码', value => encodeType.value === EncodeType.URI ? decodeURI(value) : decodeURIComponent(value))
}

// 切换模式时交换输入输出
function switchValue() {
  const temp = input.value
  input.value = output.value
  output.value = temp
  error.value = ''
}

// 清空
function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="URI：保留 URL 结构字符 ; / ? : @ & = + $ , #" />
    <Note
      color="info"
      title="URIComponent：除英文字母、数字和 - _ . ! ~ * ' ( ) 之外的所有字符都进行编码"
    />

    <ToolTextSplit>
      <template #input>
        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-sm font-medium text-muted">输入</label>
          <UTextarea
            v-model="input"
            :rows="10"
            placeholder="输入要处理的文本"
            class="w-full"
          />
        </div>
      </template>

      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <!-- 编码类型 -->
          <SegmentControl
            v-model="encodeType"
            :options="[{ label: 'URIComponent', value: EncodeType.COMPONENT }, { label: 'URI', value: EncodeType.URI }]"
          />

          <UButton
            variant="ghost"
            icon="lucide:arrow-up-down"
            color="secondary"
            @click="switchValue"
          >
            交换
          </UButton>

          <UButton
            icon="lucide:play"
            color="success"
            @click="encode"
          >
            编码
          </UButton>
          <UButton
            color="warning"
            icon="lucide:package-open"
            @click="decode"
          >
            解码
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
      </template>

      <template #output>
        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-sm font-medium text-muted">输出</label>
          <UTextarea
            v-model="output"
            :rows="10"
            placeholder="处理结果"
            readonly
            class="w-full"
          />
          <p
            v-if="error"
            class="text-sm text-error"
          >
            {{ error }}
          </p>
        </div>
      </template>
    </ToolTextSplit>
  </div>
</template>
