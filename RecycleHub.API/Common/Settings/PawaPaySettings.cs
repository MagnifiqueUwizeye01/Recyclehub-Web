namespace RecycleHub.API.Common.Settings
{
    /// <summary>pawaPay Merchant API (MTN MoMo deposits). Set ApiToken via environment or user-secrets — never commit real tokens.</summary>
    public class PawaPaySettings
    {
        public const string SectionName = "PawaPay";

        /// <summary>Optional override. If empty, host is chosen from <see cref="UseProduction"/>.</summary>
        public string BaseUrl { get; set; } = "";

        /// <summary>False = sandbox API (https://api.sandbox.pawapay.io). True = production (https://api.pawapay.io). Must match the token environment or you get AUTHENTICATION_ERROR.</summary>
        public bool UseProduction { get; set; }

        /// <summary>Bearer token from the pawaPay dashboard (sandbox vs production).</summary>
        public string ApiToken { get; set; } = "";

        public string ResolveBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(BaseUrl))
                return BaseUrl.TrimEnd('/');
            return UseProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io";
        }

        /// <summary>Default MTN Rwanda provider code.</summary>
        public string DefaultMtnProvider { get; set; } = "MTN_MOMO_RWA";
    }
}
