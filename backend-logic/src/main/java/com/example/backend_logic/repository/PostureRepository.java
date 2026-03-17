package com.example.backend_logic.repository;

import com.example.backend_logic.entity.PostureLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// 💡 JpaRepository를 상속받으면 DB 저장/삭제/조회 기능을 공짜로 얻습니다!
public interface PostureRepository extends JpaRepository<PostureLog, Long> {

    // 👈 이번 세션(측정)에 해당하는 데이터만 찾아오는 마법의 메서드 추가!
    List<PostureLog> findBySessionId(String sessionId);
}