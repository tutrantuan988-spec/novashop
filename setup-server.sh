#!/bin/bash
# NovaShop VPS Setup Script
# Run this on your new VPS (Ubuntu 22.04 LTS)
# Usage: curl -sSL https://raw.githubusercontent.com/yourusername/novashop/main/setup-server.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       NovaShop VPS Setup - Production Ready            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., novashop.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain is required${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Updating system...${NC}"
apt-get update
apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    nano \
    rsync \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js 20 LTS
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create app directory
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p /var/www/novashop/{logs,backups,certbot/conf,certbot/www}
chown -R $SUDO_USER:$SUDO_USER /var/www/novashop

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configure fail2ban
echo -e "${YELLOW}🛡️ Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-badbots]
enabled = true
filter = nginx-badbots
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noscript]
enabled = true
filter = nginx-noscript
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Setup swap (for low memory VPS)
echo -e "${YELLOW}💾 Setting up swap...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Optimize system for production
echo -e "${YELLOW}⚙️ Optimizing system...${NC}"
cat >> /etc/sysctl.conf << 'EOF'
# Increase file descriptor limits
fs.file-max = 65535

# TCP optimization for high traffic
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_tw_reuse = 1
EOF

sysctl -p

# Setup log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/novashop << 'EOF'
/var/www/novashop/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        /bin/kill -HUP $(cat /var/run/nginx.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

# Create deploy user (optional but recommended)
echo -e "${YELLOW}👤 Creating deploy user...${NC}"
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx" >> /etc/sudoers.d/deploy
fi

# Create backup script
echo -e "${YELLOW}💾 Creating backup script...${NC}"
cat > /var/www/novashop/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/novashop/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www novashop/dist novashop/server novashop/nginx

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /var/www/novashop/backup.sh

# Setup cron for auto-backup
echo "0 2 * * * /var/www/novashop/backup.sh" | crontab -

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Server setup complete!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. ${YELLOW}Clone your repo:${NC} cd /var/www/novashop && git clone <your-repo> ."
echo -e "  2. ${YELLOW}Copy .env.production${NC} to /var/www/novashop/"
echo -e "  3. ${YELLOW}Run deploy:${NC} ./deploy.sh"
echo ""
echo -e "${BLUE}Server info:${NC}"
echo -e "  • IP: ${YELLOW}$(hostname -I | awk '{print $1}')${NC}"
echo -e "  • Domain: ${YELLOW}${DOMAIN}${NC}"
echo -e "  • Docker: ${YELLOW}$(docker --version)${NC}"
echo -e "  • Node.js: ${YELLOW}$(node --version)${NC}"
echo ""
echo -e "${GREEN}🚀 Your server is ready for deployment!${NC}"
