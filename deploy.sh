#!/bin/bash
# NovaShop Production Deploy Script
# Usage: ./deploy.sh [environment]
# Environments: production (default), staging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
SERVER_USER="root"
SERVER_HOST=""
DOMAIN=""

# Load environment-specific config
if [ -f ".deploy.${ENVIRONMENT}.env" ]; then
    source ".deploy.${ENVIRONMENT}.env"
fi

if [ -z "$SERVER_HOST" ] || [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: SERVER_HOST and DOMAIN must be set${NC}"
    echo "Create .deploy.${ENVIRONMENT}.env with:"
    echo "SERVER_HOST=your-server-ip"
    echo "DOMAIN=yourdomain.com"
    exit 1
fi

echo -e "${YELLOW}🚀 Starting deployment to ${ENVIRONMENT}...${NC}"

# Step 1: Build
echo -e "${YELLOW}📦 Building application...${NC}"
npm run build

# Step 2: Prepare server
echo -e "${YELLOW}🔧 Preparing server...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p /var/www/novashop/{logs,backups,certbot/conf,certbot/www}"

# Step 3: Upload files
echo -e "${YELLOW}📤 Uploading files...${NC}"
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env.local' \
    --exclude='.env.development' \
    ./dist/ ${SERVER_USER}@${SERVER_HOST}:/var/www/novashop/dist/

rsync -avz \
    server/ ${SERVER_USER}@${SERVER_HOST}:/var/www/novashop/server/

rsync -avz \
    nginx/ ${SERVER_USER}@${SERVER_HOST}:/var/www/novashop/nginx/

rsync -avz \
    ${COMPOSE_FILE} \
    Dockerfile \
    package*.json \
    .env.production \
    ${SERVER_USER}@${SERVER_HOST}:/var/www/novashop/

# Step 4: Deploy on server
echo -e "${YELLOW}🐳 Deploying containers...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd /var/www/novashop
    
    # Replace domain in nginx config
    sed -i "s/YOUR_DOMAIN/novashop.com/g" nginx/conf.d/default.conf
    
    # Pull latest images and rebuild
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Cleanup old images
    docker image prune -f
    
    # Check health
    sleep 5
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up (healthy)"; then
        echo "✅ Deployment successful!"
    else
        echo "⚠️ Health check failed, checking logs..."
        docker-compose -f docker-compose.prod.yml logs --tail=50
    fi
EOF

# Step 5: Setup SSL if needed
echo -e "${YELLOW}🔒 Checking SSL certificate...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        echo "Obtaining SSL certificate..."
        docker run -it --rm \
            -v /var/www/novashop/certbot/conf:/etc/letsencrypt \
            -v /var/www/novashop/certbot/www:/var/www/certbot \
            certbot/certbot certonly \
            --standalone \
            --preferred-challenges http \
            -d ${DOMAIN} \
            -d www.${DOMAIN} \
            --agree-tos \
            -n \
            -m admin@${DOMAIN}
        
        # Restart nginx to apply SSL
        docker-compose -f /var/www/novashop/${COMPOSE_FILE} restart nginx
    fi
EOF

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Website: https://${DOMAIN}${NC}"
echo -e "${GREEN}🔧 API: https://${DOMAIN}/api${NC}"
