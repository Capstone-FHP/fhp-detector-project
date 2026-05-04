package com.example.backend_logic.dto;

public class PostureSessionRequestDto {

    private String userId;
    private String sessionId;
    private int score;
    private int totalSeconds;
    private int warningSeconds;
    private int dangerSeconds;
    private String createdAt;

    public String getUserId() { return userId; }
    public String getSessionId() { return sessionId; }
    public int getScore() { return score; }
    public int getTotalSeconds() { return totalSeconds; }
    public int getWarningSeconds() { return warningSeconds; }
    public int getDangerSeconds() { return dangerSeconds; }
    public String getCreatedAt() { return createdAt; }
}
