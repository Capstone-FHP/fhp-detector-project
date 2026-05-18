package com.example.backend_logic.controller;

import com.example.backend_logic.dto.PostureLogRequestDto;
import com.example.backend_logic.dto.PostureSessionRequestDto;
import com.example.backend_logic.dto.PostureSummaryResponseDto;
import com.example.backend_logic.entity.PostureLog;
import com.example.backend_logic.entity.PostureSession;
import com.example.backend_logic.repository.PostureRepository;
import com.example.backend_logic.service.PostureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posture")
// 웹 브라우저(React)에서 서버로 데이터를 보내는 것을 허용.
@CrossOrigin(origins = "http://localhost:3000")
public class PostureController {

    private final PostureRepository postureRepository;
    private final PostureService postureService;

    public PostureController(PostureRepository postureRepository, PostureService postureService) {

        this.postureRepository = postureRepository;
        this.postureService = postureService;
    }

    @PostMapping("/log")
    public ResponseEntity<String> savePostureLog(@RequestBody PostureLogRequestDto requestDto) {

        // 콘솔 출력: 웹에서 데이터가 잘 넘어오는지 확인용
        System.out.println("데이터 수신 - userId: " + requestDto.getUid()
                + ", status: " + requestDto.getStatus());

        // DTO에 담긴 데이터를 바탕으로 DB에 저장할 객체 생성
        PostureLog newLog = new PostureLog(
                requestDto.getUid(),
                requestDto.getStatus(),
                requestDto.getTimestamp(),
                requestDto.getSessionId()
        );

        postureRepository.save(newLog);

        return ResponseEntity.ok("거북목 기록 DB 저장 완료!");
    }

    //특정 세션의 모든 로그 조회 API
    @GetMapping("/logs")
    public ResponseEntity<List<PostureLog>> getLogsBySession(@RequestParam String sessionId) {
        // 쿼리 파라미터로 받은 sessionId에 해당하는 데이터만 가져옴
        List<PostureLog> logs = postureRepository.findBySessionId(sessionId);
        return ResponseEntity.ok(logs);
    }

    //특정 세션의 거북목 횟수 요약 API
    @GetMapping("/summary")
    public ResponseEntity<PostureSummaryResponseDto> getSessionSummary(@RequestParam String sessionId){
        PostureSummaryResponseDto summary= postureService.getSessionSummary(sessionId);
        return ResponseEntity.ok(summary);
    }

    // 세션 결과 저장 API
    @PostMapping("/session")
    public ResponseEntity<?> saveSession(@RequestBody PostureSessionRequestDto requestDto) {
        postureService.saveSession(requestDto);
        return ResponseEntity.ok(Map.of("message", "세션 저장 완료!"));
    }

    // 유저 과거 기록 조회 API
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<PostureSession>> getUserHistory(@PathVariable String userId) {
        List<PostureSession> history = postureService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }
}
