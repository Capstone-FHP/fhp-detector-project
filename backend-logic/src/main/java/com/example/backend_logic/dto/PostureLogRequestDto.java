package com.example.backend_logic.dto;

public class PostureLogRequestDto {
    private String userId;
    private String status;

    // 기본 생성자
    public PostureLogRequestDto() {}

    // Getter
    public String getUserId() { return userId; }
    public String getStatus() { return status; }
}