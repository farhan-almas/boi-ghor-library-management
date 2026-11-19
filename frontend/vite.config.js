import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['5173-itcm2tkkhq55rp2m89gr4-f237cdce.us1.manus.computer'],
  },
});
