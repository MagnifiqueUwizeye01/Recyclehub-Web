// Same algorithm as RecycleHub.API Helpers/PasswordHasher.cs (work factor 12).
// Usage:  dotnet run --project Tools/PasswordHash -- "YourPassword"
// Default: Admin@123!

var plain = args.Length > 0 ? args[0] : "Admin@123!";
var hash = BCrypt.Net.BCrypt.HashPassword(plain, 12);
Console.WriteLine(hash);
