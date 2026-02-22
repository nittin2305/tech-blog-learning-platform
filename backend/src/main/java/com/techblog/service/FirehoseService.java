package com.techblog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.firehose.FirehoseClient;
import software.amazon.awssdk.services.firehose.model.PutRecordRequest;
import software.amazon.awssdk.services.firehose.model.Record;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirehoseService {

    private final FirehoseClient firehoseClient;

    @Value("${aws.firehose.stream-name}")
    private String streamName;

    @Async
    public void sendEvent(String eventType, String payload) {
        try {
            String record = String.format(
                    "{\"eventType\":\"%s\",\"timestamp\":\"%s\",\"payload\":%s}\n",
                    eventType, Instant.now(), payload
            );

            firehoseClient.putRecord(PutRecordRequest.builder()
                    .deliveryStreamName(streamName)
                    .record(Record.builder()
                            .data(SdkBytes.fromString(record, StandardCharsets.UTF_8))
                            .build())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send event to Firehose: {}", eventType, e);
        }
    }
}
