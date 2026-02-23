package com.example.backend_logic.controller;

import com.example.backend_logic.dto.PostureLogRequestDto;
import com.example.backend_logic.entity.PostureLog;
import com.example.backend_logic.repository.PostureRepository; // 질문자님이 만든 Repository 임포트!
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posture")
public class PostureController {

    private final PostureRepository postureRepository;

    // 생성자를 통한 의존성 주입
    public PostureController(PostureRepository postureRepository) {
        this.postureRepository = postureRepository;
    }

    @PostMapping("/log")
    public ResponseEntity<String> savePostureLog(@RequestBody PostureLogRequestDto requestDto) {

        // 1. 데이터 잘 들어오는지 콘솔에 찍어보기
        System.out.println("안드로이드 요청 수신 - userId: " + requestDto.getUserId() + ", status: " + requestDto.getStatus());

        // 2.객체 생성
        PostureLog newLog = new PostureLog(requestDto.getUserId(), requestDto.getStatus());

        // 3. DB에 저장!
        postureRepository.save(newLog);

        // 4. 안드로이드에 성공 메시지 반환
        return ResponseEntity.ok("거북목 기록 DB 저장 완료!");
    }
}