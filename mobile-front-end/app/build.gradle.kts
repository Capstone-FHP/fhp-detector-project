import org.gradle.kotlin.dsl.implementation

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.jetbrainsKotlinAndroid)
    alias(libs.plugins.googleGmsGoogleServices)
}

android {
    namespace = "com.example.turtleapp"
    compileSdk = 35
    viewBinding.isEnabled = true

    defaultConfig {
        applicationId = "com.example.turtleapp"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // 1. Firebase BoM 설정 (괄호를 명확히 사용)
    implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
    // 2. Firebase 라이브러리 (BoM을 따르도록 괄호와 명칭 수정)
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    // 구글 로그인 라이브러리 추가
    implementation("com.google.android.gms:play-services-auth:21.2.0")

    // CameraX core library
    val camerax_version = "1.3.1"
    // 버전을 변수로 관리하면 편리합니다.
    implementation ("androidx.camera:camera-core:${camerax_version}")
    implementation ("androidx.camera:camera-camera2:${camerax_version}")
    implementation ("androidx.camera:camera-lifecycle:${camerax_version}")

    // CameraX View class
    implementation ("androidx.camera:camera-view:1.3.1")
    // 서버 통신을 위한 Retrofit 라이브러리 추가
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // MediaPipe Pose 감지 라이브러리
    implementation ("com.google.mediapipe:tasks-vision:0.10.14")
}