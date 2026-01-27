package com.example.backend_logic;

import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class ReportController {

    @PostMapping("/api/report")
    public String saveReport(@RequestBody Map<String, Object> data) {

        // 서버 콘솔에 찍어보기 (확인용)
        System.out.println("안드로이드에서 편지 도착!: " + data);

        try {

            Firestore db = FirestoreClient.getFirestore();


            db.collection("results").add(data);

            System.out.println("DB 저장 성공");
            return "서버 응답:저장 완료.";

        } catch (Exception e) {
            e.printStackTrace();
            return "서버 응답:저장 실패.";
        }
    }
}