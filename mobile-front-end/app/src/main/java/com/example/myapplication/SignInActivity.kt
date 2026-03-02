package com.example.turtleapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.example.turtleapp.databinding.ActivitySignInBinding
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth

class SignInActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySignInBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var googleSignInClient: GoogleSignInClient

    // 구글 로그인 결과 처리 런처
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)!!
                Log.d("SignInActivity", "구글 로그인 성공 (ID 토큰 가져오기)")
                firebaseAuthWithGoogle(account.idToken!!)
            } catch (e: ApiException) {
                Log.e("SignInActivity", "Google sign in failed", e)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignInBinding.inflate(layoutInflater)
        setContentView(binding.root)

        auth = Firebase.auth

        binding.btnLoginSubmit.setOnClickListener {
            val id = binding.etLoginId.text.toString()
            val pw = binding.etLoginPw.text.toString()

            // 지금은 데이터베이스가 없으니, 비어있는지만 확인하고 통과!
            if (id.isNotEmpty() && pw.isNotEmpty()) {
                //Toast.makeText(this, "로그인 성공!", Toast.LENGTH_SHORT).show()

                //[백엔드 연결]
                UserManager.login(
                    email = id,
                    pw = pw,
                    onSuccess = {
                        //로그인 성공 시 실행할 코드
                        Toast.makeText(this, "로그인 성공!", Toast.LENGTH_SHORT).show()
                        // 메인 화면으로 이동
                        val intent = Intent(this, MainActivity::class.java)
                        startActivity(intent)

                        // 로그인 성공 후에는 로그인 창과 시작 화면을 모두 닫는 것이 좋습니다.
                        finishAffinity()
                    },
                    onFail = { message ->
                        //로그인 실패 시 실행할 코드
                        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
                    }
                )


            } else {
                Toast.makeText(this, "아이디와 비밀번호를 입력해주세요.", Toast.LENGTH_SHORT).show()
            }
        }
        // 1. 구글 로그인 옵션 설정 (웹 클라이언트 ID 요청)
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id)) // 중요!
            .requestEmail()
            .build()

        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // 2. 구글 로그인 버튼 클릭 리스너
        binding.btnGoogleSignIn.setOnClickListener {
            signInWithGoogle()
        }
    }

    // 3. 구글 로그인 창 띄우기
    private fun signInWithGoogle() {
        val signInIntent = googleSignInClient.signInIntent
        googleSignInLauncher.launch(signInIntent)
    }

    // 4. Firebase에 구글 계정으로 인증
    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // 로그인 성공 -> MainActivity로 이동
                    Toast.makeText(this, "Firebase 로그인 성공", Toast.LENGTH_SHORT).show()
                    val intent = Intent(this, MainActivity::class.java)
                    startActivity(intent)
                    finish() // 로그인 화면 종료
                } else {
                    // 로그인 실패
                    Toast.makeText(this, "Firebase 로그인 실패", Toast.LENGTH_SHORT).show()
                }
            }
    }
}

