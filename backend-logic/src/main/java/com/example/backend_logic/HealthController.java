package com.example.backend_logic;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public String check() {
        return "<h1>거북목 서버 완료! </h1>";
    }
}