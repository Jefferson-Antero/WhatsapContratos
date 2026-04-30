// Portas customizáveis via variáveis de ambiente
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

module.exports = {
  apps: [
    {
      // Backend - Express Server
      name: 'whatsap-backend',
      script: './server.ts',
      interpreter: 'tsx',
      env: {
        NODE_ENV: 'production',
        PORT: BACKEND_PORT,
      },
      // Configurações de reinicialização
      max_memory_restart: '500M',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Reiniciar automaticamente em caso de erro
      max_restarts: 10,
      min_uptime: '10s',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      // Frontend - Vite Server
      name: 'whatsap-frontend',
      script: 'dist/server.js', // Após build, servir arquivos estáticos
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: FRONTEND_PORT,
      },
      max_memory_restart: '300M',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
