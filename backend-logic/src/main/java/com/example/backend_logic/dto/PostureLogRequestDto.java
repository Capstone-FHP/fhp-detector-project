package com.example.backend_logic.dto;

public class PostureLogRequestDto {
    private String userId;
    private String status;

    // Getter, Setter들
    public PostureLogRequestDto() {
    }

    public String getUserId() {
        return userId;
    }

    public String getStatus() {
        return status;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setStatus(String status) {
        this.status = status;
    }


}