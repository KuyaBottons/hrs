<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()
const isPublic = computed(() => route.meta.public)

// Shared sidebar state — lifted to App so header logo can toggle it
const sidebarOpen = ref(true)
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="app-layout" :class="{ 'no-sidebar': isPublic }">
    <template v-if="!isPublic">
      <AppSidebar :open="sidebarOpen" @toggle="toggleSidebar" />
      <div class="main-area">
        <AppHeader @toggle-sidebar="toggleSidebar" />
        <div class="content-area">
          <router-view />
        </div>
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f0f4f8;
  color: #333;
}
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.app-layout.no-sidebar { display: block; height: auto; overflow: auto; }
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}
.content-area {
  flex: 1;
  overflow-y: auto;
  background: #f0f4f8;
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f0f4f8; }
::-webkit-scrollbar-thumb { background: #c0cdd8; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #1a6b3c; }

/* Global input / select — rounded corners on hover & focus */
input, select, textarea {
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:hover, select:hover, textarea:hover {
  border-color: #1a6b3c !important;
  border-radius: 8px;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #1a6b3c !important;
  box-shadow: 0 0 0 3px rgba(26, 107, 60, 0.15);
  border-radius: 8px;
}
/* Dropdown option list radius (Chrome/Edge) */
select option { border-radius: 6px; }
</style>
