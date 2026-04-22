namespace RecycleHub.API.Helpers
{
    /// <summary>
    /// Date/time utility extensions and helpers used across services.
    /// </summary>
    public static class DateTimeHelper
    {
        /// <summary>Convert UTC DateTime to a specific timezone offset string.</summary>
        public static string ToLocalDisplay(DateTime utcTime, int offsetHours = 2)
            => utcTime.AddHours(offsetHours).ToString("yyyy-MM-dd HH:mm");

        /// <summary>Return a friendly relative time string (e.g., "2 hours ago").</summary>
        public static string ToRelativeTime(DateTime utcTime)
        {
            var diff = DateTime.UtcNow - utcTime;
            if (diff.TotalSeconds < 60) return "just now";
            if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} minute(s) ago";
            if (diff.TotalHours < 24)   return $"{(int)diff.TotalHours} hour(s) ago";
            if (diff.TotalDays < 7)     return $"{(int)diff.TotalDays} day(s) ago";
            if (diff.TotalDays < 30)    return $"{(int)(diff.TotalDays / 7)} week(s) ago";
            return utcTime.ToString("MMM dd, yyyy");
        }

        /// <summary>Get the start (midnight) of a given date in UTC.</summary>
        public static DateTime StartOfDay(DateTime date)
            => new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);

        /// <summary>Get the end (23:59:59) of a given date in UTC.</summary>
        public static DateTime EndOfDay(DateTime date)
            => new DateTime(date.Year, date.Month, date.Day, 23, 59, 59, DateTimeKind.Utc);
    }
}
