package com.example.turtleapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.turtleapp.databinding.ActivityActionBinding
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors


class ActionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityActionBinding
    private lateinit var cameraExecutor: ExecutorService

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

        // 카메라 작업을 위한 백그라운드 스레드 풀 초기화
        cameraExecutor = Executors.newSingleThreadExecutor()

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
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            // 카메라의 생명주기를 관리하는 CameraProvider
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // 미리보기를 위한 Preview 객체 생성
            val preview = Preview.Builder()
                .build()
                .also {
                    // Preview를 XML의 PreviewView와 연결
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }

            // 후면 카메라를 기본으로 선택
            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

            try {
                // 카메라를 바인딩하기 전, 기존 바인딩이 있다면 해제
                cameraProvider.unbindAll()

                // 선택된 카메라(cameraSelector)와 Preview를 Activity의 생명주기에 바인딩
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview
                )

                // 카메라가 시작되면 UI 업데이트
                binding.btnDoAction.text = "촬영 준비 완료"
                binding.btnDoAction.isEnabled = true // 실제 촬영 기능을 위해 다시 활성화하거나 용도에 맞게 변경

            } catch (exc: Exception) {
                Log.e(TAG, "카메라 바인딩에 실패했습니다.", exc)
                Toast.makeText(this, "카메라를 시작할 수 없습니다.", Toast.LENGTH_SHORT).show()
            }

        }, ContextCompat.getMainExecutor(this))
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

    override fun onDestroy() {
        super.onDestroy()
        // 액티비티가 종료될 때 카메라 스레드를 안전하게 종료
        cameraExecutor.shutdown()
    }

    // 로그 및 상수 정의
    companion object {
        private const val TAG = "ActionActivity"
    }
}