package com.example.turtleapp

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

// 전송할 데이터 양식 (스프링의 PostureLog Entity와 맞춰야 함)
data class PostureData(
    val userId: String,
    val status: String,
    val detectedAt: String? = null // 서버에서 생성하므로 비워서 보내도 됨
)

interface ApiService {
    @POST("/api/posture/log") // 스프링 컨트롤러 주소와 일치해야 함
    fun sendPostureLog(@Body data: PostureData): Call<Void>
}