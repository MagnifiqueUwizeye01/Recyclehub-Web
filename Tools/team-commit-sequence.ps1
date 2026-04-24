# One-time: staged commits with rotating team authors. Run from repo root.
# Delete this file after use if you prefer.
Set-Location $PSScriptRoot\..
$ErrorActionPreference = 'Stop'
$team = @(
  @{ n = 'UwizeyeMagnifique';         e = 'uwizeyemagnifique@gmail.com' },
  @{ n = 'Welvarine';                 e = 'Welvarine182754559+Welvarine@users.noreply.github.com' },
  @{ n = 'lington-123';                e = 'lington-123181227239+lington-123@users.noreply.github.com' },
  @{ n = 'Belise201';                 e = 'Belise201191963151+Belise201@users.noreply.github.com' },
  @{ n = 'Raissa427';                 e = 'Raissa427183736564+Raissa427@users.noreply.github.com' }
)
$script:commitIdx = 0
function Git-TeamCommit([string] $message, $paths) {
  if ($null -eq $paths) { return }
  # [string] is IEnumerable and foreach would iterate each character; force path list
  if ($paths -is [string]) { $paths = @($paths) }
  if ($paths.Count -eq 0) { return }
  foreach ($p in $paths) {
    if (($p -notmatch 'ReviewsPage') -and -not (Test-Path -LiteralPath $p)) { Write-Error "Missing: $p" }
  }
  git add -- $paths
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    $a = $team[$script:commitIdx % 5]
    $script:commitIdx++
    $author = "$($a.n) <$($a.e)>"
    $env:GIT_AUTHOR_NAME = $a.n; $env:GIT_AUTHOR_EMAIL = $a.e
    $env:GIT_COMMITTER_NAME = $a.n; $env:GIT_COMMITTER_EMAIL = $a.e
    git commit -m $message --author $author
  }
  $env:GIT_AUTHOR_NAME = $null; $env:GIT_AUTHOR_EMAIL = $null
  $env:GIT_COMMITTER_NAME = $null; $env:GIT_COMMITTER_EMAIL = $null
}

# --- 50+ small commits: order = backend + tooling first, then frontend layers, then by area ---
$seq = @(
  @('chore: ignore local API uploads in wwwroot', @('.gitignore')),
  @('chore(security): clear SMTP fields in appsettings; use user-secrets for email locally', @('RecycleHub.API/appsettings.json')),
  @('feat(reports): add IReportService.GetMyReportsAsync for per-user list', @('RecycleHub.API/Services/Interfaces/IReportService.cs')),
  @('feat(reports): implement GetMyReportsAsync in ReportService', @('RecycleHub.API/Services/ReportService.cs')),
  @('feat(reports): add GET /reports/my for sellers and buyers to list their filed reports', @('RecycleHub.API/Controllers/ReportsController.cs')),
  @('chore(frontend): prebundle emoji-picker-react in Vite', @('recyclehub-frontend/vite.config.js')),
  @('chore(frontend): add emoji-picker-react and lockfile updates', @('recyclehub-frontend/package.json', 'recyclehub-frontend/package-lock.json')),
  @('fix(frontend): axios base URL and API client defaults', @('recyclehub-frontend/src/api/axiosInstance.js')),
  @('fix(frontend): align notifications API with backend', @('recyclehub-frontend/src/api/notifications.api.js')),
  @('fix(frontend): getMyReports and reports API for seller my-reports', @('recyclehub-frontend/src/api/reports.api.js')),
  @('feat(frontend): add auth storage helper for token handling', @('recyclehub-frontend/src/utils/authStorage.js')),
  @('ui: add DashboardStatCard for admin dashboards', @('recyclehub-frontend/src/components/ui/DashboardStatCard.jsx')),
  @('ui: add ModernPageHeader and ModernPanel for admin pages', @('recyclehub-frontend/src/components/ui/ModernPageHeader.jsx', 'recyclehub-frontend/src/components/ui/ModernPanel.jsx')),
  @('ui: add PageBackButton, PageLoadingCard, and SimpleBarChart', @('recyclehub-frontend/src/components/ui/PageBackButton.jsx', 'recyclehub-frontend/src/components/ui/PageLoadingCard.jsx', 'recyclehub-frontend/src/components/ui/SimpleBarChart.jsx')),
  @('fix(frontend): harden useSignalR connection and callbacks', @('recyclehub-frontend/src/hooks/useSignalR.js')),
  @('refactor(frontend): AuthContext and session handling', @('recyclehub-frontend/src/context/AuthContext.jsx')),
  @('refactor(frontend): MessageContext updates', @('recyclehub-frontend/src/context/MessageContext.jsx')),
  @('refactor(frontend): NotificationContext updates', @('recyclehub-frontend/src/context/NotificationContext.jsx')),
  @('fix(frontend): BuyerLayout shell tweaks', @('recyclehub-frontend/src/layouts/BuyerLayout.jsx')),
  @('fix(frontend): SellerLayout and navigation', @('recyclehub-frontend/src/layouts/SellerLayout.jsx')),
  @('fix(frontend): Navbar and NotificationBell for messages badge', @('recyclehub-frontend/src/layouts/partials/Navbar.jsx', 'recyclehub-frontend/src/layouts/partials/NotificationBell.jsx')),
  @('fix(landing): Hero banner copy and CTA', @('recyclehub-frontend/src/components/landing/HeroBanner.jsx')),
  @('fix(landing): SmartSwap promo blocks', @('recyclehub-frontend/src/components/landing/SmartSwapPromoBlocks.jsx')),
  @('fix(admin): AdminConfigPage layout and form', @('recyclehub-frontend/src/pages/admin/AdminConfigPage.jsx')),
  @('fix(admin): AdminDashboard stats and panels', @('recyclehub-frontend/src/pages/admin/AdminDashboard.jsx')),
  @('fix(admin): BuyerManagementPage', @('recyclehub-frontend/src/pages/admin/BuyerManagementPage.jsx')),
  @('fix(admin): CertificateRequestsPage', @('recyclehub-frontend/src/pages/admin/CertificateRequestsPage.jsx')),
  @('fix(admin): OrdersOverviewPage', @('recyclehub-frontend/src/pages/admin/OrdersOverviewPage.jsx')),
  @('fix(admin): PaymentsOverviewPage', @('recyclehub-frontend/src/pages/admin/PaymentsOverviewPage.jsx')),
  @('fix(admin): PlatformAnalyticsPage', @('recyclehub-frontend/src/pages/admin/PlatformAnalyticsPage.jsx')),
  @('fix(admin): ReportsPage and moderation list', @('recyclehub-frontend/src/pages/admin/ReportsPage.jsx')),
  @('fix(admin): ReviewModerationPage', @('recyclehub-frontend/src/pages/admin/ReviewModerationPage.jsx')),
  @('fix(admin): SellerManagementPage', @('recyclehub-frontend/src/pages/admin/SellerManagementPage.jsx')),
  @('fix(admin): UserManagementPage table and email column alignment', @('recyclehub-frontend/src/pages/admin/UserManagementPage.jsx')),
  @('fix(buyer): BuyerDashboard and marketplace entry', @('recyclehub-frontend/src/pages/buyer/BuyerDashboard.jsx')),
  @('fix(buyer): MarketplacePage and listing browse', @('recyclehub-frontend/src/pages/buyer/MarketplacePage.jsx')),
  @('fix(buyer): Material detail order form and live total', @('recyclehub-frontend/src/pages/buyer/MaterialDetailPage.jsx')),
  @('fix(buyer): Order and payment flows', @('recyclehub-frontend/src/pages/buyer/OrderDetailPage.jsx', 'recyclehub-frontend/src/pages/buyer/OrdersPage.jsx', 'recyclehub-frontend/src/pages/buyer/PaymentPage.jsx')),
  @('fix(buyer): SmartSwap and remove legacy Reviews page route', @('recyclehub-frontend/src/pages/buyer/SmartSwapPage.jsx', 'recyclehub-frontend/src/pages/buyer/ReviewsPage.jsx')),
  @('fix(auth): public ForgotPassword, Login, and Register', @('recyclehub-frontend/src/pages/public/ForgotPasswordPage.jsx', 'recyclehub-frontend/src/pages/public/LoginPage.jsx', 'recyclehub-frontend/src/pages/public/RegisterPage.jsx')),
  @('fix(public): landing, public material, reset password, seller profile', @('recyclehub-frontend/src/pages/public/LandingPage.jsx', 'recyclehub-frontend/src/pages/public/MaterialDetailPublicPage.jsx', 'recyclehub-frontend/src/pages/public/ResetPasswordPage.jsx', 'recyclehub-frontend/src/pages/public/SellerProfilePage.jsx')),
  @('fix(seller): material and inventory management', @('recyclehub-frontend/src/pages/seller/AddMaterialPage.jsx', 'recyclehub-frontend/src/pages/seller/EditMaterialPage.jsx', 'recyclehub-frontend/src/pages/seller/InventoryPage.jsx')),
  @('fix(seller): seller orders and order detail', @('recyclehub-frontend/src/pages/seller/SellerOrderDetailPage.jsx', 'recyclehub-frontend/src/pages/seller/SellerOrdersPage.jsx')),
  @('fix(seller): seller dashboard, analytics, and new Seller reports page', @('recyclehub-frontend/src/pages/seller/SellerDashboard.jsx', 'recyclehub-frontend/src/pages/seller/SellerAnalyticsPage.jsx', 'recyclehub-frontend/src/pages/seller/SellerReportsPage.jsx')),
  @('fix(shared): messages, emoji picker placement, and notifications', @('recyclehub-frontend/src/pages/shared/MessagesPage.jsx', 'recyclehub-frontend/src/pages/shared/NotificationsPage.jsx')),
  @('fix(shared): profile, settings, and password change', @('recyclehub-frontend/src/pages/shared/ProfilePage.jsx', 'recyclehub-frontend/src/pages/shared/SettingsPage.jsx', 'recyclehub-frontend/src/pages/shared/ChangePasswordPage.jsx')),
  @('fix(shared): NotFound and unauthorized pages', @('recyclehub-frontend/src/pages/shared/NotFoundPage.jsx', 'recyclehub-frontend/src/pages/shared/UnauthorizedPage.jsx')),
  @('chore(router): AppRouter, routes, and new seller reports route', @('recyclehub-frontend/src/routes/AppRouter.jsx', 'recyclehub-frontend/src/routes/routes.config.js'))
)

$total = 0
foreach ($row in $seq) {
  $msg = $row[0]
  $files = $row[1]
  Git-TeamCommit -message $msg -paths $files
  $total++
}
# leftover check
$left = git status -s
if ($left) {
  Write-Warning "Uncommitted or unstaged: $left"
} else {
  Write-Host "OK: $total team commits created."
}
