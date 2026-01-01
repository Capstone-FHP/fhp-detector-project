package com.example.myapplication

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.myapplication.databinding.ActivitySignUpBinding

class SignUpActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySignUpBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignUpBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSignupSubmit.setOnClickListener {
            val name = binding.etSignupName.text.toString()
            val id = binding.etSignupId.text.toString()
            val pw = binding.etSignupPw.text.toString()
            val pwConfirm = binding.etSignupPwConfirm.text.toString()

            if (name.isNotEmpty() && id.isNotEmpty() && pw.isNotEmpty()) {
                if (pw == pwConfirm) {
                    Toast.makeText(this, "${name}님, 회원가입 성공!", Toast.LENGTH_SHORT).show()
                    finish() // 회원가입창 닫고 시작 화면으로 돌아감
                } else {
                    Toast.makeText(this, "비밀번호가 일치하지 않습니다.", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "모든 정보를 입력해주세요.", Toast.LENGTH_SHORT).show()
            }
        }
    }
}