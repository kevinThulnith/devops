# DevOps

DevOps project with developer tool use. This branch contains github action code.

## Project Architecture

```sh
DevOps/
├── backend/          # Django REST API (Python / uv)
├── frontend/         # React + Vite + Tailwind CSS
├── proxy/            # Nginx reverse proxy
├── docker-compose.yml
├── .env              # have to create instuctions are provided
└── README.md
```

### Setting up environment variables

The project requires a `.env` file before running in the project root directory. These files are **not committed** — create them manually.

#### 🪄 Google OAuth Credentials

Required for both Google sign-in and the `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `VITE_CLIENT_ID` variables.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (or select an existing one).
2. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Set **Application type** to **Web application**.
4. Under **Authorized JavaScript origins** add:

   ```sh
   http://localhost
   http://localhost:5173
   ```

5. Under **Authorized redirect URIs** add:

   ```sh
   http://localhost
   http://localhost:5173
   http://localhost:8000/accounts/google/login/callback/
   ```

6. Click **Create** — copy the **Client ID** and **Client Secret** into the env files below.

> Only email addresses that already exist as users in the system can sign in via Google. New Google accounts are rejected by the custom adapter.

#### 🔑 Django Secret Key

Generate a secure key with (assuming python is installed):

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Create `.env` file in project root add these values.

```env
# Postgres Settings
POSTGRES_DB=DbName
POSTGRES_USER=DbUser
POSTGRES_PASSWORD=DbPassword

# Redis Settings
REDIS_HOST=fms-prod-redis
REDIS_PORT=6379

# Database Settings
DATABASE_ENGINE=postgresql_psycopg2
DATABASE_NAME=DbName
DATABASE_USERNAME=DbUser
DATABASE_PASSWORD=DbPassword
DATABASE_HOST=fms-prod-database
DATABASE_PORT=5432
DATABASE_URL=postgresql://DbUser:DbPassword@fms-prod-database:5432/DbName

# Backend Settings
DEBUG=False
API_PORT=8000
JWT_SECRET=add-jwt-secret
SECRET_KEY=add-secret-key
CORS_ORIGINS=http://localhost,http://host.docker.internal,http://host.docker.internal:80
ALLOWED_HOSTS=localhost,host.docker.internal,127.0.0.1,localhost,localhost:5173,localhost:8000,127.0.0.1,127.0.0.1:8000,127.0.0.1:5173

# Google OAuth secrets
GOOGLE_CALLBACK_URL=http://localhost
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_CLIENT_ID=your-google-client-id
```

## Docker

### Services

| Service  | Image                | Port | Description                                 |
| -------- | -------------------- | ---- | ------------------------------------------- |
| Database | `postgres:14-alpine` | 5432 | PostgreSQL database with persistent storage |
| Redis    | `redis:7-alpine`     | 6379 | In-memory cache (LRU eviction, AOF enabled) |
| Backend  | Custom (Django)      | 8000 | Django REST API with Gunicorn               |
| Frontend | Custom (Vite/React)  | —    | One-shot builder; outputs static assets     |
| Proxy    | Custom (Nginx)       | 80   | Reverse proxy serving frontend & API routes |

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

Run this to create docker-compose setup on pc.

```sh
docker-compose --env-file .env up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ destroys data)
docker compose down -v
```

### Named Volumes

| Volume                   | Used By          | Mount Path                                 |
| ------------------------ | ---------------- | ------------------------------------------ |
| `fms-prod-database-data` | Database         | `/var/lib/postgresql/data`                 |
| `fms-prod-redis-data`    | Redis            | `/data`                                    |
| `fms-prod-frontend-dist` | Frontend → Proxy | `/frontend-dist` → `/usr/share/nginx/html` |
| `fms-prod-media-files`   | Backend → Proxy  | `/app/media`                               |
| `fms-prod-backend-logs`  | Backend          | `/app/logs`                                |
| `fms-prod-logs`          | Database, Redis  | Log directories                            |

## Seed Sample Data

Run the seed scripts **in order** inside the backend container. Each script populates a different part of the database with realistic sample data. They are backend/scripts.

| Script     | Data seeded                  |
| ---------- | ---------------------------- |
| `script1`  | Users                        |
| `script2`  | Departments                  |
| `script3`  | Workshops                    |
| `script4`  | Machines                     |
| `script5`  | Suppliers & Materials        |
| `script6`  | Production Lines             |
| `script7`  | Manufacturing Processes      |
| `script8`  | Products & Product Processes |
| `script9`  | Production Schedules         |
| `script10` | Projects & Tasks             |
| `script11` | Skill Matrix (Labor)         |

Run them one by one:

```sh
docker exec -it fms-prod-backend python scripts/script1.py
docker exec -it fms-prod-backend python scripts/script2.py
docker exec -it fms-prod-backend python scripts/script3.py
docker exec -it fms-prod-backend python scripts/script4.py
docker exec -it fms-prod-backend python scripts/script5.py
docker exec -it fms-prod-backend python scripts/script6.py
docker exec -it fms-prod-backend python scripts/script7.py
docker exec -it fms-prod-backend python scripts/script8.py
docker exec -it fms-prod-backend python scripts/script9.py
docker exec -it fms-prod-backend python scripts/script10.py
docker exec -it fms-prod-backend python scripts/script11.py
```
