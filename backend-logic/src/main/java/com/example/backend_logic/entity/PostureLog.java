package com.example.backend_logic.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity // 이 클래스는 DB 테이블이라고 알려줌
@Table(name = "posture_logs") // 테이블 이름 지정
public class PostureLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 데이터 번호 (1, 2, 3... 자동 증가)

    private String userId; // 사용자 아이디 (Firebase UID)

    private String status; // "TURTLE" (거북목) or "NORMAL" (정상)

    private LocalDateTime detectedAt; // 감지된 시간

    // 기본 생성자
    public PostureLog() {}

    // 데이터를 쉽게 넣기 위한 생성자
    public PostureLog(String userId, String status) {
        this.userId = userId;
        this.status = status;
        this.detectedAt = LocalDateTime.now(); // 현재 시간 자동 저장
    }

    // Getter, Setter 필요 (Lombok 라이브러리 쓰면 @Getter로 생략 가능)
    // 일단은 없으면 안되니 간단히 추가한다고 가정
}