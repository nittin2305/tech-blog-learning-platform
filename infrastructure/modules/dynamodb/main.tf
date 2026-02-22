resource "aws_dynamodb_table" "comments" {
  name         = "${var.project_name}-${var.environment}-comments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "commentId"

  attribute { name = "commentId"; type = "S" }
  attribute { name = "postId";    type = "S" }
  attribute { name = "createdAt"; type = "S" }

  global_secondary_index {
    name            = "postId-createdAt-index"
    hash_key        = "postId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = { Name = "${var.project_name}-${var.environment}-comments" }
}
