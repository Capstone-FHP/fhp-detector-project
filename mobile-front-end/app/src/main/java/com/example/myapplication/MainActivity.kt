package com.example.turtleapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.example.turtleapp.databinding.ActivityMainBinding
import kotlin.jvm.java

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 1번 버튼: 주요 기능 화면으로 이동
        binding.menuBtn1.setOnClickListener {
            val intent = Intent(this, ActionActivity::class.java)
            startActivity(intent)
        }

        // 2번 버튼: 통계 확인 화면으로 이동
        binding.menuBtn2.setOnClickListener {
            val intent = Intent(this, StatisticActivity::class.java)
            startActivity(intent)
        }
        // 로그아웃 버튼 (앱을 끌지 시작화면으로 돌아갈지 고민중)
        binding.btnLogout.setOnClickListener {
            val intent = Intent(this, StartActivity::class.java)
            startActivity(intent)
        }
    }
}