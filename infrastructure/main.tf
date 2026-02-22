terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "YOUR_TERRAFORM_STATE_BUCKET"
    key     = "tech-blog/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "tech-blog-learning-platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "vpc" {
  source             = "./modules/vpc"
  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  availability_zones = var.availability_zones
}

module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

module "iam" {
  source          = "./modules/iam"
  project_name    = var.project_name
  environment     = var.environment
  s3_bucket_arn   = module.s3.bucket_arn
  firehose_arn    = module.firehose.delivery_stream_arn
}

module "s3" {
  source       = "./modules/s3"
  project_name = var.project_name
  environment  = var.environment
}

module "rds" {
  source            = "./modules/rds"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.rds_sg_id
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  instance_class    = var.rds_instance_class
}

module "elasticache" {
  source            = "./modules/elasticache"
  project_name      = var.project_name
  environment       = var.environment
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.redis_sg_id
  node_type         = var.redis_node_type
}

module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

module "firehose" {
  source            = "./modules/firehose"
  project_name      = var.project_name
  environment       = var.environment
  s3_bucket_arn     = module.s3.bucket_arn
  firehose_role_arn = module.iam.firehose_role_arn
}

module "alb" {
  source            = "./modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_id = module.security_groups.alb_sg_id
}

module "ec2" {
  source               = "./modules/ec2"
  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  subnet_id            = module.vpc.private_subnet_ids[0]
  security_group_id    = module.security_groups.ec2_sg_id
  instance_type        = var.ec2_instance_type
  key_name             = var.ec2_key_name
  iam_instance_profile = module.iam.ec2_instance_profile_name
  alb_target_group_arn = module.alb.backend_target_group_arn
  frontend_tg_arn      = module.alb.frontend_target_group_arn
  aws_region           = var.aws_region

  app_env = {
    DB_URL                  = "jdbc:postgresql://${module.rds.endpoint}:5432/${var.db_name}"
    DB_USERNAME             = var.db_username
    DB_PASSWORD             = var.db_password
    REDIS_HOST              = module.elasticache.primary_endpoint
    REDIS_PORT              = "6379"
    AWS_REGION              = var.aws_region
    S3_BUCKET               = module.s3.bucket_name
    DYNAMODB_COMMENTS_TABLE = module.dynamodb.comments_table_name
    FIREHOSE_STREAM_NAME    = module.firehose.delivery_stream_name
  }
}
