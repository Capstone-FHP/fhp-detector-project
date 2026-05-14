import SwiftUI
import FirebaseCore
import FirebaseAuth
import Combine
import UserNotifications

@main
struct FHPDetectorApp: App {
    @StateObject private var authManager = AuthManager()

    init() {
        FirebaseApp.configure()
        requestNotificationPermission()
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            print(granted ? "✅ 알림 권한 허용" : "❌ 알림 권한 거부")
        }
    }

    var body: some Scene {
        WindowGroup {
            if authManager.isLoading {
                Color.white.ignoresSafeArea()
            } else if authManager.isLoggedIn {
                MainView(isLoggedIn: $authManager.isLoggedIn)
            } else {
                LoginView(isLoggedIn: $authManager.isLoggedIn)
            }
        }
    }
}

class AuthManager: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isLoading = true

    init() {
        Auth.auth().addStateDidChangeListener { _, user in
            DispatchQueue.main.async {
                self.isLoggedIn = user != nil
                self.isLoading = false
            }
        }
    }
}
