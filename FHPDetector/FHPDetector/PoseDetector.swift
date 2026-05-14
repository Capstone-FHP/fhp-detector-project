import Foundation
import MediaPipeTasksVision
import AVFoundation

// MARK: - 자세 상태
enum PostureState: String {
    case good    = "정상"
    case warning = "주의"
    case danger  = "위험"

    var colorHex: String {
        switch self {
        case .good:    return "#10B981"
        case .warning: return "#F59E0B"
        case .danger:  return "#EF4444"
        }
    }
}

// MARK: - 감지 결과
struct PoseResult {
    let angle: Double       // 표시용 각도 (earChange 기반)
    let state: PostureState
}

// MARK: - PoseDetector
// 웹 알고리즘과 동일한 방식:
//   baseline = faceWidth / shoulderWidth  (영점 조절 시 저장)
//   earChange = currentRatio / baselineRatio
//   earChange >= 1.06 → 위험
//   earChange >= 1.03 → 주의
//   3프레임 히스토리로 깜빡임 방지
class PoseDetector: NSObject {

    var onResult: ((PoseResult) -> Void)?

    private var poseLandmarker: PoseLandmarker?
    private var frameCount = 0

    private var baselineRatio: Double? = nil
    private var stateHistory: [PostureState] = []   // 최근 3프레임 히스토리

    override init() {
        super.init()
        setup()
    }

    private func setup() {
        guard let modelPath = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
            print("❌ [PoseDetector] pose_landmarker_lite.task 파일 없음")
            return
        }

        let options = PoseLandmarkerOptions()
        options.baseOptions.modelAssetPath = modelPath
        options.runningMode = .liveStream
        options.poseLandmarkerLiveStreamDelegate = self
        options.numPoses = 1
        options.minPoseDetectionConfidence = 0.5
        options.minPosePresenceConfidence  = 0.5
        options.minTrackingConfidence      = 0.5

        do {
            poseLandmarker = try PoseLandmarker(options: options)
            print("✅ [PoseDetector] 초기화 완료")
        } catch {
            print("❌ [PoseDetector] 초기화 실패: \(error)")
        }
    }

    // MARK: - 외부 인터페이스

    /// 측정 시작 — 다음 감지된 프레임을 baseline으로 저장
    func startCalibration() {
        baselineRatio = nil
        stateHistory = []
        print("🎯 [PoseDetector] 영점 조절 대기 중...")
    }

    func reset() {
        baselineRatio = nil
        stateHistory = []
    }

    func detect(sampleBuffer: CMSampleBuffer) {
        guard let poseLandmarker = poseLandmarker else { return }

        frameCount += 1

        do {
            let image = try MPImage(sampleBuffer: sampleBuffer, orientation: .left)
            let timestampMs = Int(
                CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer)) * 1000
            )
            try poseLandmarker.detectAsync(image: image, timestampInMilliseconds: timestampMs)
        } catch {
            // 프레임 드롭 — silent
        }
    }

    // MARK: - 2D 거리 계산 (웹과 동일)
    private func distance(_ p1: NormalizedLandmark, _ p2: NormalizedLandmark) -> Double {
        let dx = Double(p1.x - p2.x)
        let dy = Double(p1.y - p2.y)
        return sqrt(dx * dx + dy * dy)
    }

    // MARK: - 비율 계산
    private func calcRatio(landmarks: [NormalizedLandmark]) -> Double? {
        guard landmarks.count > 12 else { return nil }

        let leftEar       = landmarks[7]
        let rightEar      = landmarks[8]
        let leftShoulder  = landmarks[11]
        let rightShoulder = landmarks[12]

        let faceWidth     = distance(leftEar,      rightEar)      // 귀 사이 거리
        let shoulderWidth = distance(leftShoulder, rightShoulder) // 어깨 사이 거리

        guard shoulderWidth > 0.05 else { return nil }

        let ratio = faceWidth / shoulderWidth

        // ratio 범위 체크: 0.15~0.9 벗어나면 랜드마크 오감지 → 건너뜀
        guard ratio > 0.15 && ratio < 0.9 else {
            if frameCount % 30 == 0 {
                print(String(format: "⏭️ ratio 범위 오류 스킵 (ratio=%.3f)", ratio))
            }
            return nil
        }

        if frameCount % 15 == 0 {
            let earMidY      = Double(leftEar.y + rightEar.y) / 2
            let shoulderMidY = Double(leftShoulder.y + rightShoulder.y) / 2
            print(String(format: "📊 earY=%.3f shoulderY=%.3f | faceW=%.3f shoulderW=%.3f ratio=%.3f",
                         earMidY, shoulderMidY, faceWidth, shoulderWidth, ratio))
        }
        return ratio
    }

    // MARK: - 히스토리 기반 상태 안정화 (웹과 동일)
    // 최근 3프레임 중 2개 이상이 위험 → 위험 확정
    // 최근 3프레임 중 2개 이상이 주의/위험 → 주의 확정
    private func confirmState(_ newState: PostureState) -> PostureState {
        stateHistory.append(newState)
        if stateHistory.count > 3 { stateHistory.removeFirst() }

        let dangerCount  = stateHistory.filter { $0 == .danger }.count
        let warningCount = stateHistory.filter { $0 == .warning || $0 == .danger }.count

        if dangerCount >= 2  { return .danger }
        if warningCount >= 2 { return .warning }
        return .good
    }
}

// MARK: - PoseLandmarkerLiveStreamDelegate
extension PoseDetector: PoseLandmarkerLiveStreamDelegate {
    func poseLandmarker(_ poseLandmarker: PoseLandmarker,
                        didFinishDetection result: PoseLandmarkerResult?,
                        timestampInMilliseconds: Int,
                        error: Error?) {
        guard let result = result,
              let landmarks = result.landmarks.first else { return }

        guard let currentRatio = calcRatio(landmarks: landmarks) else { return }

        // 아직 baseline이 없으면 → 현재 프레임을 baseline으로 저장
        if baselineRatio == nil {
            baselineRatio = currentRatio
            print(String(format: "✅ [PoseDetector] 영점 저장 완료: baseline=%.3f", currentRatio))
            return
        }

        guard let baseline = baselineRatio else { return }

        // earChange = 현재 비율 / 기준 비율
        // 값이 클수록 얼굴이 카메라에 가까워진 것 (거북목)
        let earChange = currentRatio / baseline

        // 상태 판정 (웹과 동일한 임계값)
        let rawState: PostureState
        if earChange >= 1.06 {
            rawState = .danger
        } else if earChange >= 1.03 {
            rawState = .warning
        } else {
            rawState = .good
        }

        // 3프레임 히스토리로 안정화
        let confirmedState = confirmState(rawState)

        // 표시용 각도: earChange 1.0 → 0°, 1.03 → 15°, 1.06 → 30°
        let angle = max(0, (earChange - 1.0) / 0.06 * 30)

        if frameCount % 15 == 0 {
            print(String(format: "📐 ratio=%.3f baseline=%.3f earChange=%.3f → %@",
                         currentRatio, baseline, earChange, confirmedState.rawValue))
        }

        DispatchQueue.main.async { [weak self] in
            self?.onResult?(PoseResult(angle: angle, state: confirmedState))
        }
    }
}
