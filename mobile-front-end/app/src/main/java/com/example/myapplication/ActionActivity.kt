package com.example.myapplication

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.myapplication.databinding.ActivityActionBinding


class ActionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityActionBinding

    // 카메라 권한 받는 건데 나중에 조금 수정해야함
    // 1. 권한 요청 처리기 정의
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            // 권한 허용됨 -> 카메라 실행 모드 진입
            startCamera()
        } else {
            // 권한 거부됨
            if (!ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.CAMERA)) {
                // 사용자가 '다시 묻지 않음'을 선택한 경우 전용 다이얼로그 띄우기
                showPermissionSettingDialog()
            } else {
                Toast.makeText(this, "카메라 권한이 거부되었습니다.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityActionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 2. 동작 버튼 클릭 시 카메라 권한 체크 시작
        binding.btnDoAction.setOnClickListener {
            checkCameraPermission()
        }
    }

    // 여기도 수정
    private fun checkCameraPermission() {
        val permission = Manifest.permission.CAMERA
        when {
            // 이미 카메라 권한이 있는 경우 바로 실행
            ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED -> {
                startCamera()
            }
            // 카메라 권한이 없는 경우 시스템 팝업 요청
            else -> {
                requestPermissionLauncher.launch(permission)
            }
        }
    }

    // [테스트용] 진짜 카메라 대신 시각적 변화만 줌
    private fun startCamera() {
        // 회색 박스(View)의 색상을 바꾸고 텍스트를 띄워 확인해봅니다.
        // XML의 View ID가 viewFinder라고 가정합니다.
        binding.viewFinder.setBackgroundColor(Color.parseColor("#4CAF50")) // 초록색으로 변경
        binding.btnDoAction.text = "카메라 실행 중"
        binding.btnDoAction.isEnabled = false // 버튼 비활성화
    }

    private fun showPermissionSettingDialog() {
        AlertDialog.Builder(this)
            .setTitle("권한 설정 필요")
            .setMessage("이 기능을 사용하려면 카메라 권한이 필수입니다.\n[설정] 창에서 권한을 '허용'으로 바꿔주세요.")
            .setPositiveButton("설정으로 이동") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                val uri = Uri.fromParts("package", packageName, null)
                intent.data = uri
                startActivity(intent)
            }
            .setNegativeButton("취소", null)
            .setCancelable(false)
            .show()
    }
}