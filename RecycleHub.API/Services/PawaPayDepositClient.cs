using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class PawaPayDepositClient : IPawaPayDepositClient
    {
        private readonly HttpClient _http;
        private readonly PawaPaySettings _settings;
        private readonly ILogger<PawaPayDepositClient> _logger;

        public PawaPayDepositClient(HttpClient http, IOptions<PawaPaySettings> settings, ILogger<PawaPayDepositClient> logger)
        {
            _http = http;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<(bool Ok, string Message, string? InitStatus)> InitiateDepositAsync(
            Guid depositId,
            decimal amount,
            string currency,
            string phoneNumber,
            string provider,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiToken))
                return (false, "Payment gateway is not configured (missing PawaPay API token).", null);

            var amountStr = FormatAmount(amount, currency);
            var payload = new
            {
                depositId = depositId.ToString(),
                amount = amountStr,
                currency = currency.ToUpperInvariant(),
                payer = new
                {
                    type = "MMO",
                    accountDetails = new { phoneNumber, provider }
                }
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, "v2/deposits");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiToken.Trim());
            req.Content = JsonContent.Create(payload, options: new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            HttpResponseMessage res;
            try
            {
                res = await _http.SendAsync(req, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "pawaPay deposit HTTP failure");
                return (false, "Could not reach payment gateway.", null);
            }

            var body = await res.Content.ReadAsStringAsync(cancellationToken);
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                var root = doc.RootElement;
                var status = root.TryGetProperty("status", out var st) ? st.GetString() : null;
                if (status is "ACCEPTED" or "DUPLICATE_IGNORED")
                    return (true, status == "DUPLICATE_IGNORED" ? "Deposit already submitted." : "Deposit accepted for processing.", status);

                if (status == "REJECTED" && root.TryGetProperty("failureReason", out var fr))
                {
                    var code = fr.TryGetProperty("failureCode", out var fc) ? fc.GetString() : "";
                    var msg = fr.TryGetProperty("failureMessage", out var fm) ? fm.GetString() : "";
                    var line = $"{code}: {msg}".Trim();
                    if (code is "AUTHENTICATION_ERROR" or "NO_AUTHENTICATION" or "AUTHORISATION_ERROR")
                        line += " Ensure the API token matches the environment: sandbox uses https://api.sandbox.pawapay.io, production uses https://api.pawapay.io (see PawaPay:UseProduction).";
                    return (false, line, status);
                }

                return (false, $"Unexpected gateway response: {body}", status);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "pawaPay deposit parse error. Body: {Body}", body);
                return (false, "Invalid response from payment gateway.", null);
            }
        }

        public async Task<(bool Found, string? State, string? FailureMessage)> GetDepositStateAsync(
            Guid depositId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiToken))
                return (false, null, null);

            using var req = new HttpRequestMessage(HttpMethod.Get, $"v2/deposits/{depositId:D}");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiToken.Trim());

            HttpResponseMessage res;
            try
            {
                res = await _http.SendAsync(req, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "pawaPay check deposit failed");
                return (false, null, null);
            }

            var body = await res.Content.ReadAsStringAsync(cancellationToken);
            if (!res.IsSuccessStatusCode)
                return (false, null, body);

            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                var root = doc.RootElement;
                if (root.TryGetProperty("status", out var top) && top.GetString() == "NOT_FOUND")
                    return (false, null, null);

                if (root.TryGetProperty("data", out var data) && data.TryGetProperty("status", out var ds))
                {
                    var state = ds.GetString();
                    string? fail = null;
                    if (state == "FAILED" && data.TryGetProperty("failureReason", out var fr))
                    {
                        var code = fr.TryGetProperty("failureCode", out var fc) ? fc.GetString() : "";
                        var msg = fr.TryGetProperty("failureMessage", out var fm) ? fm.GetString() : "";
                        fail = $"{code}: {msg}".Trim();
                    }
                    return (true, state, fail);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "pawaPay check deposit parse. Body: {Body}", body);
            }

            return (false, null, null);
        }

        private static string FormatAmount(decimal amount, string currency)
        {
            var c = currency.ToUpperInvariant();
            if (c is "RWF" or "BIF" or "UGX")
                return decimal.Round(amount, 0, MidpointRounding.AwayFromZero).ToString("0", CultureInfo.InvariantCulture);
            return amount.ToString("0.###", CultureInfo.InvariantCulture);
        }
    }
}
