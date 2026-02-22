# Tech Blog Learning Platform

A full-stack learning project demonstrating real-world AWS architecture and DevOps practices.

## Architecture

```
Internet ──► Route 53 ──► ALB (Public Subnet)
                              │
                    ┌─────────┴──────────┐
                    │  /api/*            │  /*
                    ▼                    ▼
             EC2 Backend            EC2 Frontend
             (port 8080)            (port 3000)
             Private Subnet         Private Subnet
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
        RDS      ElastiCache  DynamoDB
      Postgres     Redis     (comments)
         
  ┌─────────────────────────────────────┐
  │         AWS Managed Services        │
  │  S3 (uploads) · Firehose → S3       │
  │  IAM Roles · CloudWatch · Datadog   │
  └─────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query |
| Backend | Java 17, Spring Boot 3.2, Spring Security |
| Auth | JWT (JJWT 0.12) |
| Primary DB | PostgreSQL 16 (RDS) + Flyway migrations |
| NoSQL | DynamoDB (comments) |
| Cache | Redis / ElastiCache |
| File Storage | AWS S3 |
| Event Streaming | Kinesis Data Firehose → S3 |
| Observability | Datadog, Spring Actuator |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2 t3.micro, ALB, RDS, ElastiCache, DynamoDB, S3, Firehose |

## Project Structure

```
tech-blog-learning-platform/
├── backend/                     # Spring Boot application
│   ├── src/main/java/com/techblog/
│   │   ├── config/              # AWS, Redis configuration
│   │   ├── controller/          # REST endpoints
│   │   ├── dto/                 # Request/response DTOs
│   │   ├── entity/              # JPA entities
│   │   ├── exception/           # Global error handling
│   │   ├── repository/          # Spring Data JPA repos
│   │   ├── security/            # JWT filter & config
│   │   └── service/             # Business logic
│   ├── src/main/resources/
│   │   ├── db/migration/        # Flyway SQL migrations
│   │   └── application.yml
│   └── Dockerfile
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── api/                 # Axios instance with auth interceptor
│   │   ├── components/          # Navbar, PostCard, CommentSection
│   │   ├── context/             # Auth context (JWT)
│   │   └── pages/               # HomePage, PostDetail, Create/Edit, Auth
│   ├── nginx.conf               # SPA routing + /api proxy
│   └── Dockerfile
├── infrastructure/              # Terraform modules
│   └── modules/
│       ├── vpc/                 # VPC, subnets, NAT gateway
│       ├── security_groups/     # Tiered security groups
│       ├── iam/                 # EC2 + Firehose roles
│       ├── alb/                 # Application Load Balancer
│       ├── ec2/                 # EC2 instance with user_data
│       ├── rds/                 # PostgreSQL
│       ├── elasticache/         # Redis
│       ├── dynamodb/            # Comments table
│       ├── s3/                  # Upload bucket
│       └── firehose/            # Kinesis Firehose
├── .github/workflows/
│   └── ci-cd.yml                # GitHub Actions pipeline
└── docker-compose.yml           # Local development stack
```

## Local Development

### Prerequisites
- Docker & Docker Compose

### Start all services
```bash
docker compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Health:   http://localhost:8080/actuator/health
```

### Backend only (with hot reload)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts?page=0&size=10` | No | List published posts (Redis cached) |
| GET | `/api/posts/{slug}` | No | Get post (increments view count, streams to Firehose) |
| POST | `/api/posts` | Yes | Create post |
| PUT | `/api/posts/{id}` | Yes | Update post |
| DELETE | `/api/posts/{id}` | Yes | Delete post |
| POST | `/api/posts/{id}/like` | Yes | Toggle like |

### Comments (DynamoDB)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/{id}/comments` | No | List comments |
| POST | `/api/posts/{id}/comments` | Yes | Add comment |
| DELETE | `/api/comments/{commentId}` | Yes | Delete comment |

### Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | Yes | Upload image to S3 |

## AWS Deployment

### 1. Create ECR repositories
```bash
aws ecr create-repository --repository-name tech-blog-backend --region us-east-1
aws ecr create-repository --repository-name tech-blog-frontend --region us-east-1
```

### 2. Create S3 bucket for Terraform state
```bash
aws s3 mb s3://YOUR_TERRAFORM_STATE_BUCKET --region us-east-1
# Update backend config in infrastructure/main.tf
```

### 3. Deploy infrastructure
```bash
cd infrastructure
terraform init
terraform apply -var="db_password=YOUR_SECURE_PASSWORD"
terraform output alb_dns_name
```

### 4. Required GitHub Secrets
```
AWS_ACCESS_KEY_ID        # AWS credentials
AWS_SECRET_ACCESS_KEY    # AWS credentials  
DB_PASSWORD              # RDS database password
EC2_INSTANCE_ID          # EC2 instance ID (from terraform output)
```

## Cost Estimate (Dev)

| Resource | Type | Est. Monthly |
|----------|------|-------------|
| EC2 | t3.micro | ~$8.50 |
| RDS | db.t3.micro | ~$13 |
| ElastiCache | cache.t3.micro | ~$11.50 |
| ALB | per LCU | ~$16 |
| NAT Gateway | per GB | ~$4.50 |
| DynamoDB | On-demand | <$1 |
| S3 + Firehose | Per GB | <$1 |
| **Total** | | **~$55-65/month** |

> **Tip**: Stop EC2/RDS when not in use to save ~70%

## CI/CD Pipeline

```
Push to main
    │
    ├── Backend Tests (mvn verify)
    ├── Frontend Lint + Build
    │
    └── [if both pass]
            │
            ├── Build & Push to ECR
            │
            └── Deploy to EC2 via SSM
```

## Security Notes

- CSRF disabled: stateless REST API using JWT Bearer tokens only (no cookies)
- S3 bucket: fully private, public access blocked
- EC2: IAM instance profile (no embedded credentials)
- Security groups: tiered access — internet → ALB → EC2 → RDS/Redis
- RDS: encrypted at rest, 7-day backups
