package com.example.turtleapp

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.turtleapp.databinding.ActivitySignUpBinding

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
                    //[백엔드 연결]
                    UserManager.signUp (
                        email = id,
                        pw=pw,
                        name=name,
                        onSuccess = {
                            //서버 저장까지 성공했을 때
                            Toast.makeText(this, "${name}님, 회원가입 성공!", Toast.LENGTH_SHORT).show()

                            // 회원가입 성공하면 메인 액티비티로 이동
                            val intent = Intent(this, MainActivity::class.java)
                            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK

                            startActivity(intent) // MainActivity 시작
                            finish() // 현재 SignUpActivity 종료
                        },
                        onFail = {message->
                            //실패시
                            Toast.makeText(this,message, Toast.LENGTH_SHORT).show()
                        }
                    )

                } else {
                    Toast.makeText(this, "비밀번호가 일치하지 않습니다.", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "모든 정보를 입력해주세요.", Toast.LENGTH_SHORT).show()
            }
        }
    }
}