const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

module.exports = {
  apps: [
    {
      name: 'whatsap-backend',
      script: './server.ts',
      interpreter: 'tsx',
      env: {
        NODE_ENV: 'production',
        PORT,
      },
      max_memory_restart: '500M',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
