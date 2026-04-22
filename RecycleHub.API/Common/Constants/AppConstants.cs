namespace RecycleHub.API.Common.Constants
{
    public static class AppConstants
    {
        // ── Roles ─────────────────────────────────────────────────────────
        public const string RoleAdmin  = "Admin";
        public const string RoleBuyer  = "Buyer";
        public const string RoleSeller = "Seller";

        // ── Policies ──────────────────────────────────────────────────────
        public const string PolicyAdminOnly     = "AdminOnly";
        public const string PolicyBuyerOnly     = "BuyerOnly";
        public const string PolicySellerOnly    = "SellerOnly";
        public const string PolicyAdminOrSeller = "AdminOrSeller";

        // ── SignalR ───────────────────────────────────────────────────────
        public const string NotificationHubPath = "/notificationhub";

        // ── Pagination ────────────────────────────────────────────────────
        public const int DefaultPageSize = 10;
        public const int MaxPageSize     = 100;

        // ── File Upload ───────────────────────────────────────────────────
        public const long MaxImageSizeBytes = 10 * 1024 * 1024; // 10 MB
        public static readonly string[] AllowedImageTypes =
            { "image/jpeg", "image/png", "image/webp", "image/gif" };

        // ── Currency ──────────────────────────────────────────────────────
        public const string DefaultCurrency = "RWF";
    }
}
