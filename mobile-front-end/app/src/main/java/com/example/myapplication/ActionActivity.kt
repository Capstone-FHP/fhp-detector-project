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
import androidx.camera.core.ImageAnalysis
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult


class ActionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityActionBinding
    private lateinit var cameraExecutor: ExecutorService

    // [추가] 미디어파이프 객체
    private lateinit var poseLandmarker: PoseLandmarker

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

        // [추가] 앱이 켜질 때 미디어파이프 뇌(모델)를 세팅합니다.
        setupPoseLandmarker()

        // 2. 동작 버튼 클릭 시 카메라 권한 체크 시작
        binding.btnDoAction.setOnClickListener {
            checkCameraPermission()
        }
    }

    // [새로 추가하는 함수 1] 미디어파이프 세팅
    private fun setupPoseLandmarker() {
        val baseOptions = BaseOptions.builder()
            .setModelAssetPath("pose_landmarker_lite.task") // 아까 넣은 파일 이름
            .build()

        val options = PoseLandmarker.PoseLandmarkerOptions.builder()
            .setBaseOptions(baseOptions)
            .setRunningMode(RunningMode.LIVE_STREAM) // 실시간 카메라 모드
            .setResultListener { result, _ ->
                // 분석이 끝날 때마다 이 함수가 실행됨!
                processPoseResult(result)
            }
            .setErrorListener { error ->
                Log.e(TAG, "MediaPipe 에러: ", error)
            }
            .build()

        poseLandmarker = PoseLandmarker.createFromOptions(this, options)
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

    // 추가하긴 햇음
    // [수정된 함수] startCamera()를 이렇게 통째로 바꾸세요!
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // 1. 눈으로 보는 화면 (Preview)
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }

            // 2. [추가] 뇌로 분석할 화면 (ImageAnalysis)
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST) // 최신 프레임만 분석 (버벅임 방지)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        // 카메라에서 넘어온 사진을 미디어파이프가 읽을 수 있게 변환
                        val bitmap = imageProxy.toBitmap()
                        val mpImage = BitmapImageBuilder(bitmap).build()
                        val timestampMs = imageProxy.imageInfo.timestamp / 1000000

                        // 미디어파이프에 분석 맡기기
                        poseLandmarker.detectAsync(mpImage, timestampMs)

                        // 처리가 끝난 프레임은 닫아줘야 다음 프레임이 들어옴
                        imageProxy.close()
                    }
                }

            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

            try {
                cameraProvider.unbindAll()
                // [중요] preview와 imageAnalyzer를 같이 바인딩합니다!
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalyzer)
                binding.btnDoAction.text = "분석 시작됨"

            } catch (exc: Exception) {
                Log.e(TAG, "카메라 바인딩 실패", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // [새로 추가하는 함수 2] 거북목 판별 및 UI 업데이트
    private fun processPoseResult(result: PoseLandmarkerResult) {
        // 사람이 화면에 감지되었다면
        if (result.landmarks().isNotEmpty()) {
            val landmarks = result.landmarks()[0] // 첫 번째 사람의 관절들

            // 왼쪽 귀(7번)와 왼쪽 어깨(11번) 좌표 가져오기 (전면 카메라 기준)
            val leftEar = landmarks[7]
            val leftShoulder = landmarks[11]

            // 각도 계산 수학 공식
            val dy = leftShoulder.y() - leftEar.y()
            val dx = leftShoulder.x() - leftEar.x()
            val angle = Math.toDegrees(Math.atan2(dy.toDouble(), dx.toDouble()))

            // 수직선(90도)을 기준으로 목이 얼마나 앞으로 굽었는지 절대값 계산
            val neckAngle = Math.abs(angle - 90.0)

            // UI 화면의 글자를 바꾸는 건 반드시 Main Thread에서 해야 함
            runOnUiThread {
                // 예시: 기준점 15도 이상이면 거북목으로 판정
                if (neckAngle > 15) {
                    binding.btnDoAction.text = "🚨 거북목 감지! (${neckAngle.toInt()}도)"
                    // 배경을 빨갛게 만들고 싶다면: binding.root.setBackgroundColor(Color.RED)
                } else {
                    binding.btnDoAction.text = "바른 자세 (${neckAngle.toInt()}도)"
                }
            }
        }
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