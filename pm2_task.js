module.exports = {
  apps: [
      {
          name: "SignalServerService",
          cwd: "/root/SignalServerService/",
          script: "./server.js",
          watch: ["./server.js"],
          ignore_watch: ["node_modules"],
          watch_options: {
              "followSymlinks": false
          },
          env: {
              "NODE_ENV": "development",
          },
          env_production: {
              "NODE_ENV": "production"
          }
      }
  ]
}
