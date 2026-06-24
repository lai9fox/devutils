import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'

export const toolComponentMap: Record<string, Component> = {
  'base64-codec': defineAsyncComponent(() => import('~/components/tools/base64-codec.vue')),
  'case-converter': defineAsyncComponent(() => import('~/components/tools/case-converter.vue')),
  'color-converter': defineAsyncComponent(() => import('~/components/tools/color-converter.vue')),
  'cron-parser': defineAsyncComponent(() => import('~/components/tools/cron-parser.vue')),
  'css-unit-converter': defineAsyncComponent(() => import('~/components/tools/css-unit-converter.vue')),
  'csv-tsv-converter': defineAsyncComponent(() => import('~/components/tools/csv-tsv-converter.vue')),
  'data-uri-codec': defineAsyncComponent(() => import('~/components/tools/data-uri-codec.vue')),
  'hash-digest': defineAsyncComponent(() => import('~/components/tools/hash-digest.vue')),
  'html-entity-codec': defineAsyncComponent(() => import('~/components/tools/html-entity-codec.vue')),
  'json-formatter': defineAsyncComponent(() => import('~/components/tools/json-formatter.vue')),
  'json-path-extractor': defineAsyncComponent(() => import('~/components/tools/json-path-extractor.vue')),
  'json-schema-validator': defineAsyncComponent(() => import('~/components/tools/json-schema-validator.vue')),
  'jwt-decoder': defineAsyncComponent(() => import('~/components/tools/jwt-decoder.vue')),
  'lorem-generator': defineAsyncComponent(() => import('~/components/tools/lorem-generator.vue')),
  'number-base-converter': defineAsyncComponent(() => import('~/components/tools/number-base-converter.vue')),
  'password-generator': defineAsyncComponent(() => import('~/components/tools/password-generator.vue')),
  'regex-tester': defineAsyncComponent(() => import('~/components/tools/regex-tester.vue')),
  'text-counter': defineAsyncComponent(() => import('~/components/tools/text-counter.vue')),
  'text-diff': defineAsyncComponent(() => import('~/components/tools/text-diff.vue')),
  'timestamp-converter': defineAsyncComponent(() => import('~/components/tools/timestamp-converter.vue')),
  'unicode-lookup': defineAsyncComponent(() => import('~/components/tools/unicode-lookup.vue')),
  'url-codec': defineAsyncComponent(() => import('~/components/tools/url-codec.vue')),
  'url-query-parser': defineAsyncComponent(() => import('~/components/tools/url-query-parser.vue')),
  'uuid-generator': defineAsyncComponent(() => import('~/components/tools/uuid-generator.vue')),
  'xml-formatter': defineAsyncComponent(() => import('~/components/tools/xml-formatter.vue')),
  'yaml-formatter': defineAsyncComponent(() => import('~/components/tools/yaml-formatter.vue'))
}
