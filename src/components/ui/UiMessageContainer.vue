<script setup lang="ts">
import { messageList, removeMessage } from './message'
import UiMessage from './UiMessage.vue'
</script>

<template>
  <div
    class="pointer-events-none fixed top-4 left-1/2 z-[9999] flex w-full max-w-lg -translate-x-1/2 flex-col items-center gap-2.5 px-4"
    aria-live="polite"
  >
    <TransitionGroup name="msg-slide">
      <div
        v-for="item in messageList"
        :key="item.id"
        class="flex w-full justify-center will-change-[transform,opacity]"
      >
        <UiMessage
          :type="item.type"
          :content="item.content"
          :closable="item.closable"
          @close="removeMessage(item.id)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.msg-slide-move,
.msg-slide-enter-active,
.msg-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.msg-slide-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.95);
}

.msg-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.msg-slide-leave-active {
  position: absolute;
  left: 1rem;
  right: 1rem;
  pointer-events: none;
  transition-duration: 0.22s;
}
</style>
