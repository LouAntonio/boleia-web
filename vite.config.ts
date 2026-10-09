import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		// Primeira entrada do `CORS_ORIGIN` do backend. O painel `adm` fica
		// depois, em 5174. Mudar esta porta sem a acrescentar ao backend dá
		// CORS bloqueado em todas as chamadas de API.
		port: 5173,
		strictPort: true,
	},
});
