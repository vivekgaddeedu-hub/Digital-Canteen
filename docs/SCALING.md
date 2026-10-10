# QUICKBITE V2 — Scaling and Production Deployment Architecture

This document outlines the scaling architecture, resource management, and high-availability strategy for QUICKBITE V2 Campus Digital Canteen Pre-Order System.

---

## 1. Vertical vs. Horizontal Scaling vs. Autoscaling

### A. Vertical Scaling (Scale Up)
- Increasing CPU, Memory, or I/O resources allocated to a single container or virtual host.
- In `compose.yaml`, resource limits and reservations are declared under `deploy.resources`:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 1536M
      reservations:
        cpus: '0.25'
        memory: 256M
  ```
- **Limit**: Reaches physical host constraints and still presents a single point of failure (SPOF).

### B. Horizontal Scaling (Scale Out)
- Running multiple independent application worker processes or container replicas in parallel behind a load balancer.
- In Docker Compose:
  ```bash
  docker compose up --scale app=3 -d
  ```
  *(Requires routing incoming traffic through an internal ingress or load balancer so replicas do not collide on a single host port).*

### C. Automatic Traffic-Based Autoscaling
- Automatically adjusting the number of active replicas dynamically based on metrics such as CPU utilization, memory thresholds, or request queue depth (e.g., lunch hour rush spikes).
- **Important Note**: Docker Compose does **not** provide built-in dynamic metric-based autoscaling. Autoscaling must be managed via:
  - **Kubernetes**: Horizontal Pod Autoscaler (HPA) scaling Pods between 2 and 15 replicas based on CPU target average (e.g., 70%).
  - **AWS ECS / Fargate**: Target Tracking Scaling Policy on ALB request count or CPU.
  - **Google Cloud Run**: Automatic concurrency and request-based scaling down to minimum instances and up to maximum instances.

---

## 2. Stateless Application Design

QUICKBITE V2 is architected to be completely **stateless**:
1. **Sessions & Tokens**:
   - Authentication uses cryptographic JWT tokens stored in `HttpOnly`, `SameSite=lax` secure cookies.
   - Any replica can independently verify signatures with `JWT_SECRET` without needing in-memory session synchronization or sticky sessions.
2. **Database State**:
   - Authoritative orders, menus, pickup slots, and promotions are persisted exclusively in PostgreSQL.
3. **No Local File Dependencies**:
   - Images and assets are served via remote URLs or external object storage (e.g., AWS S3 / Cloud Storage), ensuring that containers remain ephemeral.
4. **Graceful Shutdown**:
   - Next.js and Prisma catch `SIGTERM` and `SIGINT` signals, draining active requests and closing database connections cleanly.

---

## 3. Database Connection Pooling & Sizing

When scaling application replicas horizontally, each replica initializes a Prisma Client connection pool:
- Default Prisma connection limit formula: `num_physical_cpus * 2 + 1`.
- For PostgreSQL with 5 replicas each opening 10 connections, the database receives up to 50 active connections.

### Production Recommendation:
- Set PostgreSQL `max_connections = 200` in `postgresql.conf`.
- For clusters exceeding 10 replicas, place **PgBouncer** or **AWS RDS Proxy** in front of PostgreSQL to multiplex thousands of client connections into a controlled pool of 20–30 physical database backend connections.

---

## 4. Multi-Replica Load Balancing Configuration

### Nginx Reverse Proxy Example (Production Ingress):
```nginx
upstream quickbite_cluster {
    least_conn; # Route to replica with least active requests
    server app_1:3000 max_fails=3 fail_timeout=10s;
    server app_2:3000 max_fails=3 fail_timeout=10s;
    server app_3:3000 max_fails=3 fail_timeout=10s;
}

server {
    listen 80;
    server_name canteen.campus.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name canteen.campus.edu;

    ssl_certificate /etc/ssl/certs/quickbite.crt;
    ssl_certificate_key /etc/ssl/certs/quickbite.key;

    location / {
        proxy_pass http://quickbite_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check bypass
    location /api/health {
        proxy_pass http://quickbite_cluster/api/health;
        proxy_connect_timeout 2s;
        proxy_read_timeout 2s;
    }
}
```

---

## 5. Database Backup and Disaster Recovery

### Scheduled Daily Backups:
```bash
# Automated database snapshot
docker exec quickbite-postgres pg_dump -U postgres -d quickbite -Fc > /backups/quickbite_$(date +%Y%m%d_%H%M%S).dump

# Point-in-time recovery
docker exec -i quickbite-postgres pg_restore -U postgres -d quickbite -c /backups/quickbite_20261010_120000.dump
```
Ensure backups are encrypted and synchronized to off-site cloud storage with a 30-day retention policy.
