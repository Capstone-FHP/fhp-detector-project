package com.example.turtleapp

import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.firestore

//로그인, 회원가입, 로그아웃 기능 담당
object UserManager {

    private val auth = Firebase.auth
    private val db = Firebase.firestore
    private const val TAG = "UserManager"

    //회원가입 기능
    fun signUp(email: String, pw: String, name: String, onSuccess: () -> Unit, onFail: (String) -> Unit){
        //인증계정 생성
        auth.createUserWithEmailAndPassword(email,pw)
            .addOnCompleteListener {task->
                if(task.isSuccessful){
                    //계정 생성성공시 Firestore에 정보 저장
                    val user=auth.currentUser
                    val userId=user?.uid?:""

                    val userMap=hashMapOf(
                        "uid" to userId,
                        "email" to email,
                        "name" to name,
                        "createdAt" to System.currentTimeMillis()
                    )
                    //Users 컬렉션에 내 UID로 문서 만들기
                    db.collection("users").document(userId).set(userMap)
                        .addOnSuccessListener {
                            Log.d(TAG,"회원가입 및 DB저장 완료")
                            onSuccess()
                        }
                        .addOnFailureListener {e->
                            Log.e(TAG,"DB저장실패",e)
                            //DB저장 실패시 계정도 지우거나 예외처리 해야하지만 일단 알림
                            onFail("DB저장 실패: ${e.message}")
                        }
                }else{
                    //계정 생성 실패(중복이메일, 비밀번호 6자리 미만등)
                    Log.w(TAG,"회원가입 실패",task.exception)
                    onFail(task.exception?.message?:"회원 가입에 실패")
                }
            }
    }

    //로그인 기능
    fun login(email: String, pw: String, onSuccess: () -> Unit, onFail: (String) -> Unit){
        auth.signInWithEmailAndPassword(email,pw)
            .addOnCompleteListener { task->
                if(task.isSuccessful){
                    Log.d(TAG,"로그인 성공")
                    onSuccess()
                }else{
                    Log.w(TAG,"로그인 실패",task.exception)
                    onFail("로그인 실패: 아이디와 비밀번호를 입력해주세요.")
                }
            }
    }

    //로그아웃 기능
    fun logout(){
        auth.signOut()
    }

    //현재 로그인 되어있는지 확인
    fun isLogin(): Boolean{
        return auth.currentUser!=null
    }

    //현재 사용자 ID(UID)가져오기(데이터 저장할때)
    fun getCurrentUserId():String?{
        return auth.currentUser?.uid
    }
}