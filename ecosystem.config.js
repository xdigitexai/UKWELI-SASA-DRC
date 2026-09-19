module.exports = {
  apps: [{
    name: "ukweli-sasa.dolaline.site",
    cwd: "/var/www/ukweli-sasa.dolaline.site",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 5560",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "800M",
    env: { NODE_ENV: "production", PORT: "5560" }
  }]
};
