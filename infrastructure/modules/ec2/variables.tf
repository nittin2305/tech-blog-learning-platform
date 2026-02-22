variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
variable "key_name" {
  type    = string
  default = ""
}
variable "iam_instance_profile" { type = string }
variable "alb_target_group_arn" { type = string }
variable "frontend_tg_arn" { type = string }
variable "app_env" {
  type    = map(string)
  default = {}
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "registry_url" {
  type    = string
  default = ""
}
variable "backend_image" {
  type    = string
  default = "techblog-backend:latest"
}
variable "frontend_image" {
  type    = string
  default = "techblog-frontend:latest"
}
