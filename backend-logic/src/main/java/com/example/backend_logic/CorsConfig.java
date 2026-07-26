package com.example.backend_logic;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // allowedOrigins 대신 allowedOriginPatterns를 쓰면 와일드카드를 쓸 수 있다.
                // Vercel은 배포할 때마다 프리뷰 도메인이 새로 생기므로,
                // 도메인을 하나씩 등록하면 배포할 때마다 CORS가 깨진다.
                registry.addMapping("/**")
                        .allowedOriginPatterns(
                                "http://localhost:*",
                                "https://*.vercel.app"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}