# DevOps

DevOps project with developer tool use.

## Kubernetes

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Kubernetes enabled
- `kubectl` CLI

Verify Kubernetes is running:

```sh
kubectl cluster-info
```

### Cluster Overview

All resources are deployed into the **`fms-prod`** namespace. The manifests use [Kustomize](https://kustomize.io/) for orchestration.

```
k8s/
├── kustomization.yaml   # Kustomize entry point
├── namespace.yaml       # fms-prod namespace
├── secrets.yaml         # Opaque secrets (DB creds, JWT, OAuth)
├── configmap.yaml       # Non-sensitive config (hosts, ports, flags)
├── pvcs.yaml            # PersistentVolumeClaims (7 × 1Gi)
├── postgres.yaml        # Deployment + ClusterIP Service
├── redis.yaml           # Deployment + ClusterIP Service
├── backend.yaml         # Deployment (2 replicas) + ClusterIP Service
├── frontend.yaml        # Job (one-shot builder)
└── proxy.yaml           # Deployment (2 replicas) + NodePort Service
```

### Resource Details

#### Namespace

- **Name:** `fms-prod`

#### Secrets (`fms-prod-secrets`)

> ⚠️ **`k8s/secrets.yaml` is gitignored and must be created manually before deploying.**

Create the file `k8s/secrets.yaml` with your own credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: fms-prod-secrets
  namespace: fms-prod
type: Opaque
stringData:
  # PostgreSQL
  POSTGRES_DB: "<your-database-name>"
  POSTGRES_USER: "<your-database-user>"
  POSTGRES_PASSWORD: "<your-database-password>"

  # Redis
  REDIS_HOST: "fms-prod-redis"
  REDIS_PORT: "6379"

  # Database connection (must match PostgreSQL values above)
  DATABASE_NAME: "<your-database-name>"
  DATABASE_USERNAME: "<your-database-user>"
  DATABASE_PASSWORD: "<your-database-password>"
  DATABASE_HOST: "fms-prod-database"
  DATABASE_PORT: "5432"
  DATABASE_URL: "postgresql://<user>:<password>@fms-prod-database:5432/<dbname>"

  # Django
  JWT_SECRET: "<your-jwt-secret>"
  SECRET_KEY: "<your-django-secret-key>"

  # Google OAuth
  GOOGLE_CLIENT_SECRET: "<your-google-client-secret>"
  GOOGLE_CLIENT_ID: "<your-google-client-id>"

  # Frontend
  VITE_CLIENT_ID: "<your-google-client-id>"
```

You can generate secure random keys for `JWT_SECRET` and `SECRET_KEY` with:

```sh
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

#### ConfigMap (`fms-prod-config`)

Non-sensitive configuration:

- `DATABASE_ENGINE`, `DATABASE_HOST`, `DATABASE_PORT`
- `REDIS_HOST`, `REDIS_PORT`
- `DEBUG`, `API_PORT`, `CORS_ORIGINS`, `ALLOWED_HOSTS`

#### PersistentVolumeClaims

| PVC Name                    | Size | Access Mode     | Used By   |
| --------------------------- | ---- | --------------- | --------- |
| `fms-prod-database-data`    | 1Gi  | ReadWriteOnce   | Postgres  |
| `fms-prod-database-logs`    | 1Gi  | ReadWriteOnce   | Postgres  |
| `fms-prod-redis-data`       | 1Gi  | ReadWriteOnce   | Redis     |
| `fms-prod-redis-logs`       | 1Gi  | ReadWriteOnce   | Redis     |
| `fms-prod-backend-media`    | 1Gi  | ReadWriteOnce   | Backend   |
| `fms-prod-backend-logs`     | 1Gi  | ReadWriteOnce   | Backend   |
| `fms-prod-frontend-dist`    | 1Gi  | ReadWriteOnce   | Frontend → Proxy |

#### Deployments & Services

| Component  | Kind       | Replicas | Image                  | Service Type | Exposed Port |
| ---------- | ---------- | -------- | ---------------------- | ------------ | ------------ |
| PostgreSQL | Deployment | 1        | `postgres:14-alpine`   | ClusterIP    | 5432         |
| Redis      | Deployment | 1        | `redis:7-alpine`       | ClusterIP    | 6379         |
| Backend    | Deployment | 2        | `fms-prod-fms-prod-backend:latest` | ClusterIP | 8000 |
| Frontend   | Job        | —        | `fms-prod-fms-prod-frontend:latest` | —         | —            |
| Proxy      | Deployment | 2        | `fms-prod-fms-prod-proxy:latest`   | NodePort   | 80 → 30080   |

#### Health Probes

| Component  | Startup Probe         | Readiness Probe       | Liveness Probe        |
| ---------- | --------------------- | --------------------- | --------------------- |
| PostgreSQL | —                     | `pg_isready` (10s)    | `pg_isready` (30s)    |
| Redis      | —                     | `redis-cli ping` (5s) | `redis-cli ping` (20s)|
| Backend    | `GET /api/health/`    | `GET /api/health/`    | `GET /api/health/`    |
| Proxy      | —                     | `GET /health` (5s)    | `GET /health` (20s)   |

#### Init Containers

- **Backend** waits for PostgreSQL (`pg_isready`) and Redis (`redis-cli ping`) before starting.
- **Proxy** waits for the frontend build Job to produce `/usr/share/nginx/html/index.html`.

### Deploy to Kubernetes

```sh
# Build container images first (required for local images)
docker compose build

# Apply all manifests via Kustomize
kubectl apply -k k8s/

# Verify all resources
kubectl get all -n fms-prod

# Watch pods come up
kubectl get pods -n fms-prod -w

# Check logs for a specific pod
kubectl logs -n fms-prod -f <pod-name>

# port forward and access 
kubectl port-forward service/fms-prod-proxy 8080:80 -n fms-prod
```

### Access the Application

The proxy service is exposed via **NodePort 30080**:

```
http://localhost:30080
```

### Common Commands

```sh
# View all resources in the namespace
kubectl get all -n fms-prod

# Describe a specific pod
kubectl describe pod <pod-name> -n fms-prod

# Restart a deployment
kubectl rollout restart deployment/<deployment-name> -n fms-prod

# Scale backend replicas
kubectl scale deployment fms-prod-backend --replicas=3 -n fms-prod

# Delete all resources
kubectl delete -k k8s/

# Re-run the frontend build job
kubectl delete job fms-prod-frontend -n fms-prod
kubectl apply -k k8s/

# Port-forward for debugging (e.g. database)
kubectl port-forward svc/fms-prod-database 5432:5432 -n fms-prod
```

### Resource Limits

| Component  | CPU Request | CPU Limit | Memory Request | Memory Limit |
| ---------- | ----------- | --------- | -------------- | ------------ |
| PostgreSQL | 500m        | 2         | 512Mi          | 2Gi          |
| Redis      | 250m        | 1         | 256Mi          | 768Mi        |
| Backend    | 500m        | 2         | 512Mi          | 2Gi          |
| Frontend   | 250m        | 1         | 256Mi          | 1Gi          |
| Proxy      | 100m        | 1         | 128Mi          | 512Mi        |
