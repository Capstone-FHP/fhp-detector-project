package com.example.backend_logic.repository;

import com.example.backend_logic.entity.PostureSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostureSessionRepository extends JpaRepository<PostureSession, Long> {
    List<PostureSession> findByUserIdOrderByCreatedAtDesc(String userId);
}
