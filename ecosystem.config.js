module.exports = {
  apps: [
    {
      name: "sblt-cup",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "512M",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
