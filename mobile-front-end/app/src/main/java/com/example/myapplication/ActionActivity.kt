package com.example.turtleapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.turtleapp.databinding.ActivityActionBinding
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ActionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityActionBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var poseLandmarker: PoseLandmarker

    // 🐢 거북목 판별을 위한 상태 변수들 (웹 코드에서 가져옴)
    private var baselineRatio: Float? = null         // 영점 (바른 자세일 때의 비율)
    private var currentLatestRatio: Float? = null    // 현재 카메라에 인식된 최신 비율
    private val historyList = mutableListOf<Boolean>() // 스무딩 바구니 (최근 3번의 결과)
    private var warningState = false                 // 현재 경고 상태 (화면 깜빡임 방지용)

    companion object {
        private const val TAG = "ActionActivity"
    }

    // 1. 카메라 권한 요청 처리기
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            startCamera() // 권한 획득 시 카메라 켜기
        } else {
            if (!ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.CAMERA)) {
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

        cameraExecutor = Executors.newSingleThreadExecutor()

        // 미디어파이프 AI 두뇌 세팅
        setupPoseLandmarker()

        // 화면 켜지자마자 카메라 권한 확인 및 실행
        checkCameraPermission()

        // 🎯 영점 조절 버튼 클릭 시
        binding.btnCalibrate.setOnClickListener {
            if (currentLatestRatio != null) {
                // 현재 사람의 자세 비율을 기준(영점)으로 삼음
                baselineRatio = currentLatestRatio
                historyList.clear() // 스무딩 기록 초기화

                // UI 업데이트
                binding.tvStatus.text = "✅ 영점 조절 완료! 측정을 시작합니다."
                binding.tvStatus.setBackgroundColor(Color.parseColor("#D4EDDA"))
                binding.tvStatus.setTextColor(Color.parseColor("#155724"))

                Toast.makeText(this, "영점 조절 완료! 자세를 유지해주세요.", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "사람이 인식되지 않았습니다. 화면 정면에 서주세요.", Toast.LENGTH_SHORT).show()
            }
        }

        // ⏹️ 종료 버튼 클릭 시
        binding.btnStop.setOnClickListener {
            finish() // 현재 화면 끄기 (이전 화면으로 돌아감)
        }
    }

    // 미디어파이프 뼈대 인식기 초기화
    private fun setupPoseLandmarker() {
        try {
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("pose_landmarker_lite.task") // assets 폴더에 넣은 모델 파일
                .build()

            val options = PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.LIVE_STREAM) // 실시간 카메라 모드
                .setResultListener { result, _ ->
                    processPoseResult(result) // 분석 끝날 때마다 호출
                }
                .setErrorListener { error ->
                    Log.e(TAG, "MediaPipe 에러: ", error)
                }
                .build()

            poseLandmarker = PoseLandmarker.createFromOptions(this, options)
        } catch (e: Exception) {
            Log.e(TAG, "MediaPipe 초기화 실패", e)
            Toast.makeText(this, "AI 모델을 불러오지 못했습니다.", Toast.LENGTH_LONG).show()
        }
    }

    // 카메라 권한 확인
    private fun checkCameraPermission() {
        val permission = Manifest.permission.CAMERA
        when {
            ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED -> {
                startCamera()
            }
            else -> {
                requestPermissionLauncher.launch(permission)
            }
        }
    }

    // 카메라 실행 및 AI와 연결
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // 1. 눈으로 보는 화면 (Preview)
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }

            // 2. 뇌로 분석할 화면 (ImageAnalysis)
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        val bitmap = imageProxy.toBitmap()
                        val mpImage = BitmapImageBuilder(bitmap).build()
                        val timestampMs = imageProxy.imageInfo.timestamp / 1000000

                        // 미디어파이프에 이미지 던져주기
                        poseLandmarker.detectAsync(mpImage, timestampMs)

                        imageProxy.close() // 다음 프레임을 위해 닫아줌
                    }
                }

            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

            try {
                cameraProvider.unbindAll()
                // 화면에 보여주면서(preview) 동시에 분석(imageAnalyzer)
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalyzer)
            } catch (exc: Exception) {
                Log.e(TAG, "카메라 바인딩에 실패했습니다.", exc)
            }

        }, ContextCompat.getMainExecutor(this))
    }

    // 두 점 사이의 거리를 구하는 수학 공식
    private fun calculateDistance(x1: Float, y1: Float, x2: Float, y2: Float): Float {
        return Math.sqrt(Math.pow((x2 - x1).toDouble(), 2.0) + Math.pow((y2 - y1).toDouble(), 2.0)).toFloat()
    }

    // 🐢 실시간 거북목 분석 핵심 로직
    private fun processPoseResult(result: PoseLandmarkerResult) {
        if (result.landmarks().isNotEmpty()) {
            val landmarks = result.landmarks()[0] // 첫 번째 사람의 뼈대

            val leftEar = landmarks[7]
            val rightEar = landmarks[8]
            val leftShoulder = landmarks[11]
            val rightShoulder = landmarks[12]

            // 현재 얼굴 너비와 어깨 너비 계산
            val faceWidth = calculateDistance(leftEar.x(), leftEar.y(), rightEar.x(), rightEar.y())
            val shoulderWidth = calculateDistance(leftShoulder.x(), leftShoulder.y(), rightShoulder.x(), rightShoulder.y())

            // 현재 비율 저장 (영점 조절 버튼을 누를 때 사용하기 위함)
            currentLatestRatio = faceWidth / shoulderWidth

            // 영점 조절(Calibration)이 완료된 상태라면 판별 시작
            if (baselineRatio != null) {
                // 1.1배(10%) 이상 비율이 커졌는지 확인 (앞으로 쏠림)
                val isForwardLeaning = currentLatestRatio!! > (baselineRatio!! * 1.1f)

                // 스무딩 로직: 최근 3번의 결과 바구니에 담기
                historyList.add(isForwardLeaning)
                if (historyList.size > 3) {
                    historyList.removeAt(0) // 3개가 넘으면 가장 오래된 것 버리기
                }

                // 3번 중 2번 이상 거북목으로 판별되었는가?
                val fhpCount = historyList.count { it } // true인 개수 세기
                val isConfirmedFhp = fhpCount >= 2

                // 상태가 바뀌었을 때만 화면(UI) 업데이트
                if (warningState != isConfirmedFhp) {
                    warningState = isConfirmedFhp

                    runOnUiThread {
                        if (isConfirmedFhp) {
                            binding.tvStatus.text = "🚨 거북목 주의! 목을 뒤로 빼주세요!"
                            binding.tvStatus.setBackgroundColor(Color.parseColor("#F8D7DA")) // 빨간색 배경
                            binding.tvStatus.setTextColor(Color.parseColor("#721C24"))
                        } else {
                            binding.tvStatus.text = "✅ 바른 자세를 유지 중입니다"
                            binding.tvStatus.setBackgroundColor(Color.parseColor("#D4EDDA")) // 연두색 배경
                            binding.tvStatus.setTextColor(Color.parseColor("#155724"))
                        }
                    }
                }
            }
        } else {
            // 카메라에 사람이 안 보일 때
            currentLatestRatio = null
        }
    }

    // 권한 거부 시 설정 창으로 유도하는 팝업
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
        cameraExecutor.shutdown()
        if (::poseLandmarker.isInitialized) {
            poseLandmarker.close() // 앱 꺼질 때 AI 모델도 닫아주기
        }
    }
}