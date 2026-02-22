resource "aws_kinesis_firehose_delivery_stream" "events" {
  name        = "${var.project_name}-${var.environment}-events"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = var.firehose_role_arn
    bucket_arn          = var.s3_bucket_arn
    prefix              = "firehose/events/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "firehose/errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    buffering_size      = 5
    buffering_interval  = 300
    compression_format  = "GZIP"
  }

  tags = { Name = "${var.project_name}-${var.environment}-events" }
}
