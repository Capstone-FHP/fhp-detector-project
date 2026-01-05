package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.myapplication.databinding.ActivityStartBinding

class StartActivity : AppCompatActivity() {

    private lateinit var binding: ActivityStartBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. 뷰 바인딩 설정
        binding = ActivityStartBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 2. 상단바까지 화면 확장
        enableEdgeToEdge()

        // 3. 시스템 바 영역 패딩 설정 (기존 레이아웃 유지)
        ViewCompat.setOnApplyWindowInsetsListener(binding.main) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // [삭제됨] 여기서 더 이상 checkCameraPermission()을 호출하지 않습니다.

        // 로그인 버튼 클릭 시 이동
        binding.btnGoLogin.setOnClickListener {
            val intent = Intent(this, SignInActivity::class.java)
            startActivity(intent)
        }

        // 회원가입 버튼 클릭 시 이동
        binding.btnGoRegister.setOnClickListener {
            val intent = Intent(this, SignUpActivity::class.java)
            startActivity(intent)
        }
    }
}