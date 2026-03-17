package com.example.backend_logic.entity;

import jakarta.persistence.*; // Spring Boot 버전에 따라 javax.persistence일 수 있음
import java.time.LocalDateTime;

@Entity
public class PostureLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String uid;
    private String status;
    private String  timestamp; // 저장 시간 자동 기록용
    private String sessionId;

    // 기본 생성자
    public PostureLog() {}

    // 생성자 수정
    public PostureLog(String uid, String status,String timestamp,String sessionId) {
        this.uid = uid;
        this.status = status;
        this.timestamp =timestamp; // 현재 시간 자동 저장
        this.sessionId=sessionId;
    }

    public Long getId() {
        return id;
    }

    public String getUid() {
        return uid;
    }

    public String getStatus() {
        return status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public String getSessionId(){return sessionId;}

    public void setId(Long id) {
        this.id = id;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public void setSessionId(String sessionId) { this.sessionId=sessionId;}
}