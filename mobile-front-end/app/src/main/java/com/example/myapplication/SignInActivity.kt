package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.myapplication.databinding.ActivitySignInBinding

class SignInActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySignInBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignInBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLoginSubmit.setOnClickListener {
            val id = binding.etLoginId.text.toString()
            val pw = binding.etLoginPw.text.toString()

            // 지금은 데이터베이스가 없으니, 비어있는지만 확인하고 통과!
            if (id.isNotEmpty() && pw.isNotEmpty()) {
                Toast.makeText(this, "로그인 성공!", Toast.LENGTH_SHORT).show()

                // 메인 화면으로 이동
                val intent = Intent(this, MainActivity::class.java)
                startActivity(intent)

                // 로그인 성공 후에는 로그인 창과 시작 화면을 모두 닫는 것이 좋습니다.
                finishAffinity()
            } else {
                Toast.makeText(this, "아이디와 비밀번호를 입력해주세요.", Toast.LENGTH_SHORT).show()
            }
        }
    }
}