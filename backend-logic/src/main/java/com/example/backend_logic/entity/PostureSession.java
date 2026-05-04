package com.example.backend_logic.entity;

import jakarta.persistence.*;

@Entity
public class PostureSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private String sessionId;
    private int score;
    private int totalSeconds;
    private int warningSeconds;
    private int dangerSeconds;
    private String createdAt;

    public PostureSession() {}

    public PostureSession(String userId, String sessionId, int score,
                          int totalSeconds, int warningSeconds, int dangerSeconds, String createdAt) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.score = score;
        this.totalSeconds = totalSeconds;
        this.warningSeconds = warningSeconds;
        this.dangerSeconds = dangerSeconds;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public String getSessionId() { return sessionId; }
    public int getScore() { return score; }
    public int getTotalSeconds() { return totalSeconds; }
    public int getWarningSeconds() { return warningSeconds; }
    public int getDangerSeconds() { return dangerSeconds; }
    public String getCreatedAt() { return createdAt; }
}
