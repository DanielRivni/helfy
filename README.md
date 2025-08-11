# Part 2: DevOps Implementation (Docker + TiDB + Kafka)

This sets up the full stack with Docker Compose:
- **API**: Node/Express (same API as Part 1) + Kafka producer
- **Client**: Nginx serving the static HTML
- **Database**: Local TiDB cluster (PD, TiKV, TiDB) in Docker
- **Kafka**: Single-broker Kafka (KRaft mode, no ZooKeeper)
- **Auto DB init**: A one-off container seeds the schema and creates a default user

## Prerequisites (Windows)
- Install **Docker Desktop** and start it.
- Ensure ports **4000**, **3001**, **8080**, **9092** are free.

## Quick start
```powershell
cd .\part2
docker compose up -d --build
```

### What this does
- Launches TiDB (PD + TiKV + TiDB)
- Launches Kafka (bitnami/kafka in KRaft mode)
- Builds and runs the API and Client images
- Runs a `db-init` job that:
  - waits for TiDB to be reachable
  - applies `schema.sql`
  - creates a default user (see env below)

### Access
- Client: http://localhost:8080
- API:    http://localhost:3001
- TiDB:   mysql client at localhost:4000
- Kafka:  PLAINTEXT at localhost:9092

## Default credentials (seeded by db-init)
- Email: `admin@example.com`
- Password: `Admin12345!`

(Change them by editing `docker-compose.yml` environment for the `db-init` service.)

## Environment
The API reads DB and Kafka settings from env vars. In Docker, they’re provided by `docker-compose.yml`:

```yaml
environment:
  PORT: 3001
  TIDB_HOST: tidb
  TIDB_PORT: 4000
  TIDB_USER: root
  TIDB_PASSWORD: ""
  TIDB_DATABASE: myapp
  TIDB_USE_SSL: "false"
  KAFKA_BROKER: kafka:9092
```

## Common commands
```powershell
# View logs for a service
docker compose logs -f api
docker compose logs -f tidb
docker compose logs -f kafka
docker compose logs -f db-init

# Rebuild after code changes
docker compose up -d --build api client

# Tear down everything
docker compose down -v
```

## Notes
- This TiDB setup is for **local development** only. For production, use TiDB Cloud or a proper TiDB cluster.
- Kafka is configured with PLAINTEXT for local dev only.
