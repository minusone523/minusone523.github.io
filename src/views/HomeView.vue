<template>
    <section>
      <p>This site is built with FastAPI and Vue.</p>
    </section>
  </template>
  <script>
  
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'HomeView',
    computed : {
      isLoggedIn: function() {
        return this.$store.getters.isAuthenticated;
      }
    },
  });
  </script>
  