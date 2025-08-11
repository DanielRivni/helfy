# Part 2 - Simple Web App with TiDB, Kafka, Node.js, and React

This is **Part 2** of the SRE Assignment.  
It includes:
- Backend API (Node.js + Express)
- Frontend client (React)
- TiDB database
- Kafka (Bitnami)
- Zookeeper

Everything runs via Docker Compose.

---

## 🚀 Quick Start

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd part2
```

### 2. Setup `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure:
```env
DEFAULT_USER_EMAIL=admin@example.com
DEFAULT_USER_PASSWORD=Admin12345!
```

### 3. Start Containers
```bash
docker compose up -d --build
```

### 4. Initialize Database
Create schema:
```bash
docker run -it --rm --network=part2_default mysql:8.0   mysql -h part2-tidb -P 4000 -u root -e "
    CREATE DATABASE IF NOT EXISTS myapp;
    USE myapp;
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      token VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  "
```

### 5. Seed Default User
```bash
docker exec -it part2-api node src/seed.js
```

---

## 🔑 Login Details
- **Email:** `admin@example.com`
- **Password:** `Admin12345!`

Access:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

---

## 🛠 Services
| Service   | Port  | Description          |
|-----------|-------|----------------------|
| API       | 3001  | Node.js Backend      |
| Client    | 3000  | React Frontend       |
| TiDB      | 4000  | SQL Database         |
| Kafka     | 9092  | Message Broker       |
| Zookeeper | 2181  | Kafka Coordination   |

---

## 🧹 Stop Everything
```bash
docker compose down -v
```
