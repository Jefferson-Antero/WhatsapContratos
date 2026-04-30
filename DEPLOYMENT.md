# 🚀 Guia de Deploy com PM2

Este guia explica como fazer o deploy da aplicação WhatsApp Contratos em um servidor Linux/Unix usando PM2.

## 📋 Requisitos

- Node.js 18+ instalado no servidor
- npm ou yarn
- PM2 (será instalado automaticamente)
- Git (para clonar o repositório)
- Nginx ou Apache (opcional, para reverse proxy)

## 🛠️ Passo 1: Preparar o Servidor

### 1.1 Conectar ao servidor via SSH
```bash
ssh usuario@seu-servidor-ip
```

### 1.2 Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Node.js (se não estiver instalado)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## 📦 Passo 2: Clonar e Configurar o Projeto

### 2.1 Navegar ao diretório de projetos
```bash
cd /var/www  # ou outro diretório de sua preferência
```

### 2.2 Clonar o repositório
```bash
git clone https://github.com/Jefferson-Antero/WhatsapContratos.git
cd WhatsapContratos
```

### 2.3 Instalar dependências
```bash
npm install
```

### 2.4 Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
nano .env
```

**Configurações importantes:**
```bash
# .env
NODE_ENV=production
GOOGLE_API_KEY=sua_chave_api_aqui
PORT=3001
```

## 🚀 Passo 3: Deploy com PM2

### 3.1 Instalar PM2 globalmente
```bash
npm install -g pm2
```

### 3.2 Fazer build da aplicação
```bash
npm run build
```

### 3.2 Iniciar com PM2 usando ecosystem.config.js
```bash
pm2 start ecosystem.config.js
```

### 3.3 Verificar status
```bash
pm2 status
pm2 logs
```

### 3.4 Configurar PM2 para iniciar no boot
```bash
pm2 startup
pm2 save
```

## 🔄 Passo 4: Configurar Reverse Proxy (Nginx)

### 4.1 Instalar Nginx
```bash
sudo apt install -y nginx
```

### 4.2 Criar arquivo de configuração
```bash
sudo nano /etc/nginx/sites-available/whatsap-contratos
```

### 4.3 Adicionar configuração
```nginx
upstream backend {
  server localhost:3001;
}

upstream frontend {
  server localhost:3000;
}

server {
  listen 80;
  server_name seu-dominio.com www.seu-dominio.com;

  # API Backend
  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # Arquivos estáticos
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://frontend;
    proxy_cache_valid 200 30d;
    proxy_cache_use_stale_if_error;
  }
}
```

### 4.4 Habilitar site
```bash
sudo ln -s /etc/nginx/sites-available/whatsap-contratos /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Opcional: remover site padrão
```

### 4.5 Testar configuração
```bash
sudo nginx -t
```

### 4.6 Reiniciar Nginx
```bash
sudo systemctl restart nginx
```

## 🔐 Passo 5: SSL com Certbot (Opcional mas Recomendado)

### 5.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Gerar certificado
```bash
sudo certbot certonly --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 5.3 Atualizar configuração Nginx
```bash
sudo nano /etc/nginx/sites-available/whatsap-contratos
```

Adicionar:
```nginx
server {
  listen 443 ssl http2;
  server_name seu-dominio.com www.seu-dominio.com;

  ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

  # ... resto da configuração anterior ...
}

# Redirecionar HTTP para HTTPS
server {
  listen 80;
  server_name seu-dominio.com www.seu-dominio.com;
  return 301 https://$server_name$request_uri;
}
```

### 5.4 Reiniciar Nginx
```bash
sudo systemctl restart nginx
```

## 📊 Monitoramento e Manutenção

### Comandos PM2 úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de aplicação específica
pm2 logs whatsap-backend

# Monitorar CPU e memória
pm2 monit

# Reiniciar aplicações
pm2 restart all
pm2 restart whatsap-backend

# Parar aplicações
pm2 stop all
pm2 stop whatsap-backend

# Deletar aplicações
pm2 delete all

# Salvar lista de processos
pm2 save

# Recuperar lista de processos
pm2 resurrect
```

### Visualizar logs
```bash
# Logs armazenados em
cat logs/backend-out.log
cat logs/backend-error.log
cat logs/frontend-out.log
cat logs/frontend-error.log

# Limpar logs antigos
pm2 flush
```

## 🔄 Atualizar Aplicação

### Quando houver atualizações no GitHub:

```bash
cd /var/www/WhatsapContratos

# Atualizar código
git pull origin master

# Reinstalar dependências se necessário
npm install

# Fazer build
npm run build

# Reiniciar PM2
pm2 restart all
```

Ou crie um script automático (cron job):
```bash
# Editar crontab
crontab -e

# Adicionar (exemplo: todos os dias às 2 AM)
0 2 * * * cd /var/www/WhatsapContratos && git pull && npm install && npm run build && pm2 restart all
```

## 🐛 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs de erro
pm2 logs whatsap-backend
pm2 logs whatsap-frontend

# Verificar se portas estão sendo usadas
netstat -tuln | grep -E '3000|3001'

# Matar processo na porta se necessário
sudo lsof -ti:3001 | xargs kill -9
```

### Erro de permissão
```bash
# Dar permissão ao usuário
sudo chown -R $USER:$USER /var/www/WhatsapContratos

# Executar PM2 como sudo (não recomendado)
sudo pm2 start ecosystem.config.js
sudo pm2 save
```

### PM2 não inicia no boot
```bash
# Gerar script de inicialização
pm2 startup

# Salvar processos
pm2 save

# Verificar
systemctl status pm2-$USER  # Substituir $USER pelo seu usuário
```

### Porta já em uso
```bash
# Ver processos usando as portas
sudo lsof -i :3001
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID
```

## 📈 Performance e Segurança

### Recomendações

1. **Use HTTPS** - Configure SSL com Let's Encrypt
2. **Nginx Cache** - Configure cache para arquivos estáticos
3. **Gzip** - Comprima respostas
4. **Rate Limiting** - Proteção contra abuse
5. **Monitoramento** - Use PM2 Plus ou Monit
6. **Backups** - Faça backup regular do banco de dados
7. **Logs** - Rotacione logs antigos
8. **Firewall** - Configure UFW no servidor

```bash
# Exemplo: UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🎯 Checklist Final

- [ ] Node.js 18+ instalado
- [ ] Projeto clonado e dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Build realizado com sucesso
- [ ] PM2 instalado globalmente
- [ ] Aplicações iniciadas com PM2
- [ ] PM2 configurado para boot automático
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

**Documentação criada em:** 30 de Abril de 2026  
**Versão:** 1.0
