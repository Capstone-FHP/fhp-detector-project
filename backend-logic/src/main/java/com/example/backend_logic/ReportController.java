package com.example.backend_logic;

import com.example.backend_logic.entity.PostureLog;
import com.example.backend_logic.repository.PostureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class ReportController {

    @Autowired
    private PostureRepository postureRepository; // 스프링이 알아서 가져다 줌 (의존성 주입)

    @PostMapping("/api/report")
    public String saveReport(@RequestBody Map<String, Object> data) {

        // 1. 안드로이드에서 보낸 데이터 꺼내기
        // (보안 검증은 다음 단계에서 추가할 예정!)
        String userId = (String) data.get("uid"); // 안드로이드가 uid를 보내준다고 가정
        String status = (String) data.get("status");

        // 2. MySQL에 저장할 객체 생성
        PostureLog log = new PostureLog(userId, status);

        // 3. 저장! (SQL 쿼리가 자동으로 날아감)
        postureRepository.save(log);

        return "서버 응답: MySQL에 안전하게 저장했습니다!";
    }
}