package com.example.backend_logic; // 👈 패키지 이름은 님꺼 그대로 두세요!

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct; // 만약 이게 빨간줄이면 javax.annotation.PostConstruct 로 바꿔보세요
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            // 1. resources 폴더에서 키 파일을 읽어옵니다.
            InputStream serviceAccount = new ClassPathResource("serviceAccountKey.json").getInputStream();

            // 2. Firebase 설정 정보를 만듭니다.
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            // 3. 이미 연결된 게 없으면 연결합니다. (중복 방지)
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
                System.out.println("🔥  Firebase 연결 성공!  🔥");
                System.out.println("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println(" 연결 실패! 파일 이름이나 위치를 확인하세요! ");
        }
    }
}