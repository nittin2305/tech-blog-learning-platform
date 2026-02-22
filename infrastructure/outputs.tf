output "alb_dns_name" {
  description = "ALB DNS name (application entry point)"
  value       = module.alb.dns_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.primary_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "dynamodb_comments_table" {
  value = module.dynamodb.comments_table_name
}

output "firehose_stream_name" {
  value = module.firehose.delivery_stream_name
}

output "ec2_private_ip" {
  value     = module.ec2.private_ip
  sensitive = true
}
