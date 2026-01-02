package com.example.myapplication

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import com.example.myapplication.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 1. 툴바를 액션바로 설정하거나, 그냥 네비게이션 아이콘 클릭 리스너 달기
        binding.toolbar.setNavigationOnClickListener {
            // 왼쪽 끝(START)에서 메뉴 열기
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }

        // 2. 슬라이드 메뉴(NavigationView) 클릭 리스너
        binding.navView.setNavigationItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> Toast.makeText(this, "홈 클릭", Toast.LENGTH_SHORT).show()
                R.id.nav_search -> Toast.makeText(this, "검색 클릭", Toast.LENGTH_SHORT).show()
                R.id.nav_profile -> Toast.makeText(this, "프로필 클릭", Toast.LENGTH_SHORT).show()
            }
            binding.drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }

    override fun onBackPressed() {
        if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
}