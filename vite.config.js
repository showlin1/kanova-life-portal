import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      output: {
        manualChunks(id) {
          if (id.includes('AdminPage')) return 'admin';
          if (id.includes('HomePage')) return 'home';
          if (id.includes('CoursesPage')) return 'courses';
          if (id.includes('CourseDetailPage')) return 'detail';
          if (id.includes('BookingPage')) return 'book';
          if (id.includes('LocationsPage')) return 'locations';
          if (id.includes('BlogPage') || id.includes('BlogDetailPage')) return 'blog';
        }
      }
    }
  }
});
