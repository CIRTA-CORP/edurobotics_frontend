import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Split heavy third-party libs into their own chunks so they download in
    // parallel and stay cached across deploys (an app-code change no longer
    // invalidates the multi-MB Babylon/Monaco/Blockly bundles). Routes are
    // already lazy-loaded, so the simulator's vendors still only load on /simulator.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@babylonjs')) return 'vendor-babylon'
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor-monaco'
          if (id.includes('blockly') || id.includes('@blockly')) return 'vendor-blockly'
          // Match ONLY the real React packages (not e.g. @tiptap/react or
          // @monaco-editor/react, which contain "/react/" in their path).
          if (/[/\\]node_modules[/\\](react|react-dom|react-router|react-router-dom|scheduler)[/\\]/.test(id)) {
            return 'vendor-react'
          }
          if (id.includes('@tanstack')) return 'vendor-query'
        },
      },
    },
    // Babylon is inherently large; raise the warning threshold to avoid noise
    // now that vendors are split into their own dedicated chunks.
    chunkSizeWarningLimit: 1500,
  },
})
