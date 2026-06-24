<script setup lang="ts">
/**
 * HTML 实体编解码工具
 * 支持命名实体和数字实体两种模式
 */

type EntityMode = 'named' | 'numeric'
const entityMode = ref<EntityMode>('named')
const input = ref('')
const output = ref('')
const error = ref('')

// 命名实体映射
const namedEntityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '¢': '&cent;',
  '§': '&sect;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '≤': '&le;',
  '≥': '&ge;',
  '≠': '&ne;',
  '∞': '&infin;',
  '←': '&larr;',
  '→': '&rarr;',
  '↑': '&uarr;',
  '↓': '&darr;',
  '♠': '&spades;',
  '♣': '&clubs;',
  '♥': '&hearts;',
  '♦': '&diams;',
  ' ': '&nbsp;'
}

// 反向映射
const reverseNamedMap: Record<string, string> = {}
for (const [char, entity] of Object.entries(namedEntityMap)) {
  reverseNamedMap[entity] = char
}

function encodeNamed(text: string): string {
  return text.replace(/[&<>"'©®™€£¥¢§°±×÷≤≥≠∞←→↑↓♠♣♥♦]/g, ch => namedEntityMap[ch] ?? ch)
}

function encodeNumeric(text: string): string {
  let result = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    // ASCII 可打印字符中仅对 HTML 特殊字符编码；非 ASCII 全部编码
    if (code > 127 || ch === '&' || ch === '<' || ch === '>' || ch === '"' || ch === '\'') {
      result += `&#${code};`
    } else {
      result += ch
    }
  }
  return result
}

function decodeEntities(text: string): string {
  const invalidEntities: string[] = []
  function decodeCodePoint(raw: string, radix: number, entity: string): string {
    const codePoint = Number.parseInt(raw, radix)
    if (
      !Number.isInteger(codePoint)
      || codePoint < 0
      || codePoint > 0x10FFFF
      || (codePoint >= 0xD800 && codePoint <= 0xDFFF)
    ) {
      invalidEntities.push(entity)
      return entity
    }
    return String.fromCodePoint(codePoint)
  }

  // 先解码命名实体
  let result = text.replace(/&[a-zA-Z]+;/g, entity => reverseNamedMap[entity] ?? entity)
  // 再解码数字实体（十进制）
  result = result.replace(/&#(\d+);/g, (entity, code) => decodeCodePoint(code, 10, entity))
  // 十六进制数字实体
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (entity, hex) => decodeCodePoint(hex, 16, entity))
  if (invalidEntities.length) {
    error.value = `发现 ${invalidEntities.length} 个无效数字实体，已保留原文本`
  }
  return result
}

function encode() {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }
  output.value = entityMode.value === 'named'
    ? encodeNamed(input.value)
    : encodeNumeric(input.value)
}

function decode() {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }
  output.value = decodeEntities(input.value)
}

function switchValue() {
  const temp = input.value
  input.value = output.value
  output.value = temp
  error.value = ''
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}

// 常用实体参考表
const referenceEntities = [
  { char: '&', named: '&amp;', numeric: '&#38;', desc: 'And 符号' },
  { char: '<', named: '&lt;', numeric: '&#60;', desc: '小于号' },
  { char: '>', named: '&gt;', numeric: '&#62;', desc: '大于号' },
  { char: '"', named: '&quot;', numeric: '&#34;', desc: '双引号' },
  { char: '\'', named: '&apos;', numeric: '&#39;', desc: '单引号' },
  { char: ' ', named: '&nbsp;', numeric: '&#160;', desc: '不间断空格' },
  { char: '©', named: '&copy;', numeric: '&#169;', desc: '版权' },
  { char: '®', named: '&reg;', numeric: '&#174;', desc: '注册商标' },
  { char: '™', named: '&trade;', numeric: '&#8482;', desc: '商标' },
  { char: '€', named: '&euro;', numeric: '&#8364;', desc: '欧元' }
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <Note title="将特殊字符编码为 HTML 实体，或将 HTML 实体解码还原为原始字符。" />
    <Note
      color="info"
      title="命名实体：可读性好（如 &amp;amp;）；数字实体：兼容性好（如 &amp;#38;）"
    />

    <ToolTextSplit>
      <template #input>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">输入</label>
          <UTextarea
            v-model="input"
            :rows="8"
            placeholder="输入要编码或解码的文本..."
            class="font-mono text-sm"
          />
        </div>
      </template>

      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <SegmentControl
            v-model="entityMode"
            :options="[
              { label: '命名实体', value: 'named' as EntityMode },
              { label: '数字实体', value: 'numeric' as EntityMode }
            ]"
          />
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
            icon="lucide:arrow-up-down"
            color="secondary"
            @click="switchValue"
          >
            交换
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
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted">
            输出
            <span
              v-if="error"
              class="text-sm text-error"
            >
              {{ error }}
            </span>
          </label>
          <UTextarea
            v-model="output"
            :rows="8"
            placeholder="处理结果"
            readonly
            class="font-mono text-sm"
          />
        </div>
      </template>
    </ToolTextSplit>

    <!-- 常用实体参考 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-muted">常用 HTML 实体参考</label>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-elevated text-muted">
              <th class="px-3 py-2 text-left font-medium">
                字符
              </th>
              <th class="px-3 py-2 text-left font-medium">
                说明
              </th>
              <th class="px-3 py-2 text-left font-medium">
                命名实体
              </th>
              <th class="px-3 py-2 text-left font-medium">
                数字实体
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ent in referenceEntities"
              :key="ent.char"
              class="border-t border-default"
            >
              <td class="px-3 py-2 font-mono text-default">
                {{ ent.char === ' ' ? '(空格)' : ent.char }}
              </td>
              <td class="px-3 py-2 text-muted">
                {{ ent.desc }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ ent.named }}
              </td>
              <td class="px-3 py-2 font-mono text-default">
                {{ ent.numeric }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
