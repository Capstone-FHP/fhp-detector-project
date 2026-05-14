import Foundation
import Combine
import UserNotifications

// MARK: - 거북목 알림 관리자
// 규칙:
//   위험/주의 상태가 60초 연속 → 1차 알림
//   이후 30초 더 지속 → 2차 알림
//   이후 180초마다 반복
//   정상 복귀 시 전부 리셋

class PostureAlertManager: ObservableObject {

    // 앱 내 배너 표시용
    @Published var bannerMessage: String? = nil

    private var badPostureSeconds = 0      // 연속 거북목 시간(초)
    private var alertFiredCount   = 0      // 몇 번 알림 보냈는지
    private var isBadPosture      = false  // 현재 거북목 상태 여부

    // 알림 간격 설정
    private let firstAlertSec  = 60        // 1차 알림: 60초
    private let secondAlertSec = 90        // 2차 알림: 90초 (60+30)
    private let repeatSec      = 180       // 이후 반복: 매 180초

    // MARK: - 매 1초마다 CameraTab 타이머에서 호출
    func tick(state: PostureState) {
        switch state {
        case .warning, .danger:
            isBadPosture = true
            badPostureSeconds += 1
            checkAndFireAlert()
        case .good:
            if isBadPosture { reset() }
        }
    }

    // MARK: - 알림 조건 체크
    private func checkAndFireAlert() {
        let threshold: Int
        if alertFiredCount == 0 {
            threshold = firstAlertSec
        } else if alertFiredCount == 1 {
            threshold = secondAlertSec
        } else {
            threshold = secondAlertSec + repeatSec * (alertFiredCount - 1)
        }

        if badPostureSeconds >= threshold {
            alertFiredCount += 1
            fireAlert(seconds: badPostureSeconds)
        }
    }

    // MARK: - 알림 발송
    private func fireAlert(seconds: Int) {
        let min = seconds / 60
        let msg = min >= 1
            ? "\(min)분째 거북목 자세입니다! 고개를 들어주세요 🐢"
            : "\(seconds)초째 거북목 자세입니다! 자세를 바로잡아주세요"

        // 앱 내 배너
        DispatchQueue.main.async {
            self.bannerMessage = msg
            // 4초 후 배너 자동 숨김
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                self.bannerMessage = nil
            }
        }

        // 로컬 푸시 알림 (화면이 꺼져있을 때를 대비)
        let content = UNMutableNotificationContent()
        content.title = "거북목 경고 🐢"
        content.body  = msg
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil  // 즉시 발송
        )
        UNUserNotificationCenter.current().add(request)

        print("🔔 [알림] \(msg)")
    }

    // MARK: - 리셋 (정상 자세 복귀 or 측정 종료)
    func reset() {
        badPostureSeconds = 0
        alertFiredCount   = 0
        isBadPosture      = false
        DispatchQueue.main.async { self.bannerMessage = nil }
    }
}
