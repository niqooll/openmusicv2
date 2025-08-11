# Quick Setup Guide - OpenMusic API v3

## 🚀 Quick Start

### 1. Prerequisites Installation

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install RabbitMQ
sudo apt install -y rabbitmq-server
```

#### macOS (using Homebrew):
```bash
# Install Node.js
brew install node@18

# Install PostgreSQL
brew install postgresql@13
brew services start postgresql@13

# Install Redis
brew install redis
brew services start redis

# Install RabbitMQ
brew install rabbitmq
brew services start rabbitmq
```

#### Windows:
- Install Node.js 18 dari [nodejs.org](https://nodejs.org/)
- Install PostgreSQL dari [postgresql.org](https://www.postgresql.org/download/windows/)
- Install Redis menggunakan [Memurai](https://www.memurai.com/)
- Install RabbitMQ dari [rabbitmq.com](https://www.rabbitmq.com/install-windows.html)

### 2. Database Setup

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Buat user dan database
CREATE USER openmusic_user WITH PASSWORD 'your_password';
CREATE DATABASE openmusic OWNER openmusic_user;
GRANT ALL PRIVILEGES ON DATABASE openmusic TO openmusic_user;
\q
```

### 3. Project Setup

```bash
# Clone & install
git clone <your-repo-url>
cd openmusic-api-v3
npm install

# Setup environment
cp .env.example .env
```

### 4. Configure Environment Variables

Edit `.env` file:
```bash
# Database
DATABASE_URL=postgresql://openmusic_user:your_password@localhost:5432/openmusic

# JWT Secrets (generate strong secrets)
ACCESS_TOKEN_KEY=your-super-secret-access-token-key-here
REFRESH_TOKEN_KEY=your-super-secret-refresh-token-key-here

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Services
RABBITMQ_SERVER=amqp://localhost
REDIS_SERVER=localhost
```

### 5. Run Migrations

```bash
npm run migrate:up
```

### 6. Start Application

```bash
# Development (2 terminal windows needed)
# Terminal 1:
npm run dev

# Terminal 2:
npm run dev:consumer

# Production
chmod +x scripts/start.sh
./scripts/start.sh
```

## 🔧 Service Configuration

### RabbitMQ Management
Access RabbitMQ management UI at: http://localhost:15672
- Username: guest
- Password: guest

### Redis CLI
Test Redis connection:
```bash
redis-cli ping
# Should return PONG
```

### PostgreSQL Test
```bash
psql -h localhost -U openmusic_user -d openmusic -c "SELECT version();"
```

## 📧 Email Configuration

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password in SMTP_PASSWORD

### Other Email Providers:
- **Outlook**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Configure according to your provider

## 🔑 JWT Secret Generation

Generate strong secrets:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

## 🧪 Testing

```bash
# Test server
curl http://localhost:5000/albums

# Test upload (need multipart/form-data)
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "cover=@path/to/image.jpg" \
  http://localhost:5000/albums/{album-id}/covers
```

## 🐳 Docker Setup (Optional)

```bash
# Build and run with docker-compose
docker-compose up -d

# Run migrations
docker-compose exec app npm run migrate:up
```

## 🔍 Troubleshooting

### Common Issues:

1. **Port already in use**:
   ```bash
   lsof -ti:5000 | xargs kill -9
   ```

2. **Database connection failed**:
   - Check PostgreSQL is running
   - Verify DATABASE_URL
   - Check user permissions

3. **Redis connection failed**:
   ```bash
   sudo systemctl start redis
   # or
   brew services start redis
   ```

4. **RabbitMQ connection failed**:
   ```bash
   sudo systemctl start rabbitmq-server
   # or
   brew services start rabbitmq
   ```

5. **File upload failed**:
   - Check uploads directory exists
   - Verify file permissions
   - Check disk space

### Logs:
```bash
# View server logs
tail -f logs/application-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

## 📚 API Documentation

Server akan berjalan di: http://localhost:5000

### Quick Test Endpoints:
- `GET /albums` - List albums
- `POST /users` - Register user
- `POST /authentications` - Login
- `GET /playlists` - List playlists (requires auth)

### Authentication:
1. Register: `POST /users`
2. Login: `POST /authentications`
3. Use accessToken in Authorization header: `Bearer {token}`

---

Need help? Check the main README.md or create an issue in the repository.