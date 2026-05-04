package com.example.backend_logic.service;

import com.example.backend_logic.dto.PostureSessionRequestDto;
import com.example.backend_logic.dto.PostureSummaryResponseDto;
import com.example.backend_logic.entity.PostureLog;
import com.example.backend_logic.entity.PostureSession;
import com.example.backend_logic.repository.PostureRepository;
import com.example.backend_logic.repository.PostureSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostureService {

    private final PostureRepository postureRepository;
    private final PostureSessionRepository postureSessionRepository;

    public PostureService(PostureRepository postureRepository, PostureSessionRepository postureSessionRepository) {
        this.postureRepository = postureRepository;
        this.postureSessionRepository = postureSessionRepository;
    }

    // 세션 결과 저장
    public void saveSession(PostureSessionRequestDto dto) {
        PostureSession session = new PostureSession(
                dto.getUserId(),
                dto.getSessionId(),
                dto.getScore(),
                dto.getTotalSeconds(),
                dto.getWarningSeconds(),
                dto.getDangerSeconds(),
                dto.getCreatedAt()
        );
        postureSessionRepository.save(session);
    }

    // 유저의 과거 세션 기록 조회
    public List<PostureSession> getUserHistory(String userId) {
        return postureSessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 세션별 요약 통계를 계산하는 메서드
    public PostureSummaryResponseDto getSessionSummary(String sessionId) {

        // 1단계: DB에서 해당 sessionId를 가진 모든 기록을 꺼내옴
        List<PostureLog> logs = postureRepository.findBySessionId(sessionId);

        // 2단계: 꺼내온 기록들을 하나씩 보면서 횟수를 세어봄
        long totalMeasurements = logs.size(); // 전체 기록 개수

        // 상태가 "warning"인 것만 필터링해서 개수를 셈
        long warningCount = logs.stream()
                .filter(log -> "warning".equals(log.getStatus()))
                .count();

        // 상태가 "danger"인 것만 필터링해서 개수를 셈
        long dangerCount = logs.stream()
                .filter(log -> "danger".equals(log.getStatus()))
                .count();

        return new PostureSummaryResponseDto(sessionId, totalMeasurements, warningCount, dangerCount);
    }
}