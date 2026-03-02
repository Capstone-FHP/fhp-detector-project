package com.example.backend_logic.repository;

import com.example.backend_logic.entity.PostureLog;
import org.springframework.data.jpa.repository.JpaRepository;

// <다룰 엔티티, PK 타입>
public interface PostureRepository extends JpaRepository<PostureLog, Long> {
    // 여기에 아무 코드가 없어도 save(), findAll() 등을 쓸 수 있음
}