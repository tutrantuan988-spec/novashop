#!/bin/bash
# Start NovaShop server with correct PostgreSQL credentials
export DATABASE_URL="postgresql://novashop_user:novashop_password_dev@localhost:5432/novashop_db"
export NODE_ENV="development"
export PORT="3001"

NODE="/mnt/c/Program Files/nodejs/node.exe"
SCRIPT="server/index.js"
cd "$(dirname "$0")"
"$NODE" "$SCRIPT" > /tmp/server.log 2>&1 &
echo "Server PID: $!"
echo "Log: /tmp/server.log"
