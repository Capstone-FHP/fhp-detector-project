package com.example.backend_logic.dto;

public class PostureLogRequestDto {
    private String uid;
    private String status;
    private String timestamp;
    private String sessionId;

    // Getter, Setter들
    public PostureLogRequestDto() {
    }

    public String getUid() {
        return uid;
    }

    public String getStatus() {
        return status;
    }

    public String getTimestamp() {return timestamp;}

    public String getSessionId() {return sessionId;}


    public void setUid(String uid) {
        this.uid = uid;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTimestamp(String timestamp){this.timestamp=timestamp;}

    public void setSessionId(String sessionId){this.sessionId=sessionId;}


}