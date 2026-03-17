package com.example.backend_logic.entity;

import jakarta.persistence.*; // Spring Boot 버전에 따라 javax.persistence일 수 있음
import java.time.LocalDateTime;

@Entity
public class PostureLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private String status;
    private LocalDateTime  timestamp; // 저장 시간 자동 기록용

    // 기본 생성자
    public PostureLog() {}

    // 생성자 수정
    public PostureLog(String userId, String status) {
        this.userId = userId;
        this.status = status;
        this.timestamp =LocalDateTime.now(); // 현재 시간 자동 저장
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}