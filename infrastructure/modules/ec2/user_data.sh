#!/bin/bash
set -euo pipefail

# Install Docker
yum update -y
yum install -y docker aws-cli
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Write environment variables
cat > /etc/app.env << 'ENVEOF'
%{ for key, value in app_env ~}
${key}=${value}
%{ endfor ~}
ENVEOF
chmod 600 /etc/app.env

# Login to ECR and start containers
REGISTRY_URL="${registry_url}"
if [ -n "$REGISTRY_URL" ]; then
  aws ecr get-login-password --region ${aws_region} | \
    docker login --username AWS --password-stdin "$REGISTRY_URL"
fi

docker run -d --env-file /etc/app.env -p 8080:8080 \
  --name techblog-backend --restart unless-stopped ${backend_image}

docker run -d -p 3000:80 \
  --name techblog-frontend --restart unless-stopped ${frontend_image}
