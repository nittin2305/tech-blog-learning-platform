data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name"; values = ["al2023-ami-2023.*-x86_64"] }
  filter { name = "virtualization-type"; values = ["hvm"] }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.iam_instance_profile
  key_name               = var.key_name != "" ? var.key_name : null

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_env        = var.app_env
    aws_region     = var.aws_region
    registry_url   = var.registry_url
    backend_image  = var.backend_image
    frontend_image = var.frontend_image
  }))

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = true
    encrypted             = true
  }

  tags = { Name = "${var.project_name}-${var.environment}-app" }
  lifecycle { create_before_destroy = true }
}

resource "aws_lb_target_group_attachment" "backend" {
  target_group_arn = var.alb_target_group_arn
  target_id        = aws_instance.app.id
  port             = 8080
}

resource "aws_lb_target_group_attachment" "frontend" {
  target_group_arn = var.frontend_tg_arn
  target_id        = aws_instance.app.id
  port             = 3000
}
