# 🚀 Deploy Rápido com PM2 - Quick Start

## ⚡ 5 Passos para Deploy em Produção

### Passo 1: No seu servidor, instale as dependências
```bash
cd /var/www/WhatsapContratos
npm install
npm install -g pm2  # Se ainda não tiver PM2 instalado
```

### Passo 2: Configure variáveis de ambiente
```bash
cp .env.example .env
nano .env  # Edite com suas configurações
```

### Passo 3: Faça o build
```bash
npm run build
```

### Passo 4: Inicie com PM2
```bash
pm2 start ecosystem.config.js
pm2 save              # Salvar para inicializar no boot
pm2 startup          # Configurar para iniciar no boot
```

### Passo 5: Configure Nginx (opcional mas recomendado)
```bash
sudo nano /etc/nginx/sites-available/whatsap-contratos
# Copie a configuração do arquivo DEPLOYMENT.md (Seção 4.3)
sudo systemctl restart nginx
```

---

## 📋 Comandos PM2 Essenciais

```bash
# Status
pm2 status              # Ver status das aplicações
pm2 logs                # Ver logs em tempo real
pm2 monit               # Monitor de CPU/Memória

# Controle
pm2 restart all         # Reiniciar tudo
pm2 stop all            # Parar tudo
pm2 delete all          # Remover do PM2

# Depois de atualizar o código
git pull
npm install
npm run build
pm2 restart all
```

---

## 🆘 Troubleshooting Rápido

**Aplicação não inicia?**
```bash
pm2 logs whatsap-backend
pm2 logs whatsap-frontend
```

**Porta em uso?**
```bash
sudo lsof -i :3001    # Verificar porta 3001
sudo lsof -i :3000    # Verificar porta 3000
```

**PM2 não persiste após reboot?**
```bash
pm2 save
pm2 startup
systemctl status pm2-$USER
```

---

## 📊 Monitorar Aplicação

### Terminal
```bash
pm2 logs              # Logs contínuos
pm2 monit             # Monitoramento CPU/RAM
```

### Browser
Acesse sua aplicação em:
- `http://seu-dominio.com` (Frontend)
- `http://seu-dominio.com/api/*` (API Backend)

### Logs armazenados
```bash
cat logs/backend-out.log
cat logs/backend-error.log
cat logs/frontend-out.log
cat logs/frontend-error.log
```

---

## 🔄 Deploy de Atualização

Quando atualizar o código:
```bash
cd /var/www/WhatsapContratos
git pull origin master
npm install
npm run build
pm2 restart all
```

Ou torne automático com cron:
```bash
crontab -e
# Adicionar: 0 2 * * * cd /var/www/WhatsapContratos && git pull && npm install && npm run build && pm2 restart all
```

---

Para guia completo, veja: **[DEPLOYMENT.md](./DEPLOYMENT.md)**
