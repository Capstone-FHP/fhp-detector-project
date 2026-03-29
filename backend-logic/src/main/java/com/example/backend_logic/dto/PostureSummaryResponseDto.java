package com.example.backend_logic.dto;

public class PostureSummaryResponseDto {
    private String sessionId;
    private long totalMeasurements; // 전체 데이터 수
    private long warningCount;      // 주황불(warning) 횟수
    private long dangerCount;       // 빨간불(danger) 횟수

    // 생성자 (데이터를 포장할 때 사용)
    public PostureSummaryResponseDto(String sessionId, long totalMeasurements, long warningCount, long dangerCount) {
        this.sessionId = sessionId;
        this.totalMeasurements = totalMeasurements;
        this.warningCount = warningCount;
        this.dangerCount = dangerCount;
    }

    // Getter (스프링이 이 객체를 JSON으로 변환해서 프론트엔드로 보낼 때 필요함)
    public String getSessionId() { return sessionId; }
    public long getTotalMeasurements() { return totalMeasurements; }
    public long getWarningCount() { return warningCount; }
    public long getDangerCount() { return dangerCount; }
}