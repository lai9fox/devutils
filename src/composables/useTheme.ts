import { ref, onMounted, onUnmounted } from 'vue'

// 模块级单例响应式状态，保证全局各组件（如 Header / 工作台）状态与图标完全同步
const isDark = ref(false)

function getResolvedDark(): boolean {
  if (typeof document === 'undefined') return false
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'dark') return true
  if (storedTheme === 'light') return false
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return document.documentElement.classList.contains('dark')
}

function updateThemeState() {
  if (typeof document === 'undefined') return
  isDark.value = document.documentElement.classList.contains('dark')
}

function applyThemeToDOM(dark: boolean, save = true) {
  if (typeof document === 'undefined') return
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
    document.documentElement.style.backgroundColor = '#09090b'
    document.documentElement.style.colorScheme = 'dark'
    if (save) localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.backgroundColor = '#fafafa'
    document.documentElement.style.colorScheme = 'light'
    if (save) localStorage.setItem('theme', 'light')
  }

  // 同步移动端与 macOS Safari 浏览器顶栏 theme-color
  const meta =
    document.getElementById('theme-color-meta') ||
    document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', dark ? '#09090b' : '#fafafa')
  }
}

function toggleTheme() {
  if (typeof document === 'undefined') return
  // 以 DOM 当前实际状态取反，杜绝由于初始化状态不一致导致的点击反向问题
  const currentDark = document.documentElement.classList.contains('dark')
  applyThemeWithTransition(!currentDark, true)
}

function applyThemeWithTransition(dark: boolean, save = true) {
  if (typeof document === 'undefined') return

  const supportsViewTransition =
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (supportsViewTransition) {
    document.documentElement.classList.add('theme-transitioning')
    try {
      const transition = (document as any).startViewTransition(() => {
        applyThemeToDOM(dark, save)
      })
      if (transition && transition.finished) {
        transition.finished.finally(() => {
          document.documentElement.classList.remove('theme-transitioning')
        })
      } else {
        document.documentElement.classList.remove('theme-transitioning')
      }
    } catch {
      applyThemeToDOM(dark, save)
      document.documentElement.classList.remove('theme-transitioning')
    }
  } else {
    // 降级：短暂禁用过渡，使所有元素在同一帧内瞬间对齐，杜绝速度不一致导致的割裂感
    const style = document.createElement('style')
    style.setAttribute('data-devutils-theme-guard', '')
    style.textContent = '*, *::before, *::after { transition: none !important; }'
    document.head.appendChild(style)

    applyThemeToDOM(dark, save)

    void document.documentElement.offsetHeight
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function handleStorage(e: StorageEvent) {
  if (e.key === 'theme') {
    const nextDark = getResolvedDark()
    applyThemeWithTransition(nextDark, false)
  }
}

function handleMediaQuery(e: MediaQueryListEvent) {
  // 仅在用户未主动通过 localStorage 固定主题时，跟随系统切换
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('theme')) {
    applyThemeWithTransition(e.matches, false)
  }
}

// 浏览器环境中模块加载时立即初始化一次状态
if (typeof document !== 'undefined') {
  updateThemeState()
}

export function useTheme() {
  let mediaQuery: MediaQueryList | null = null

  onMounted(() => {
    updateThemeState()

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)

      if (window.matchMedia) {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleMediaQuery)
        } else if ('addListener' in mediaQuery) {
          ;(mediaQuery as any).addListener(handleMediaQuery)
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('astro:after-swap', updateThemeState)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)

      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaQuery)
        } else if ('removeListener' in mediaQuery) {
          ;(mediaQuery as any).removeListener(handleMediaQuery)
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('astro:after-swap', updateThemeState)
    }
  })

  return {
    isDark,
    toggleTheme,
    updateThemeState
  }
}
