<script setup lang="ts">
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center p-24">
    <div class="z-10 max-w-5xl w-full flex-col items-center justify-between font-mono text-sm lg:flex">
      <h1 class="text-4xl font-bold mb-8">MaestroSheet</h1>
      <div class="flex gap-4">
        <RouterLink to="/login" class="text-primary hover:underline">Login</RouterLink>
        <RouterLink to="/register" class="text-primary hover:underline">Register</RouterLink>
      </div>
    </div>
  </main>
</template>
