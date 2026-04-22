/*
================================================================================
  RecycleHub — stored procedures
================================================================================
  Source of truth: RecycleHub.API (Entity Framework Core)

  FINDING
  -------
  This application does **not** invoke SQL Server stored procedures. All data
  access goes through EF Core (`AppDbContext` and repositories/services). There
  are no `FromSqlRaw` / `ExecuteSql` calls targeting procedures in the codebase.

  WHAT TO DO WITH THIS FILE
  --------------------------
  • Share it as-is so teammates know **no procs are required** to run the API.
  • Optionally add your own procedures below for reporting, housekeeping, or
    DBA-only operations — the API will ignore them unless you wire them in.

  OPTIONAL TEMPLATE (commented)
  ------------------------------
  Uncomment and customize if your team adds server-side logic.

--------------------------------------------------------------------------------
-- EXAMPLE — list materials pending admin verification (read-only reporting)
--------------------------------------------------------------------------------
/*
CREATE OR ALTER PROCEDURE [dbo].[usp_Report_MaterialsPendingVerification]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.[MaterialId], m.[Title], m.[SellerUserId], m.[Status], m.[CreatedAt]
    FROM [dbo].[Materials] AS m
    WHERE m.[Status] = N'Pending'
    ORDER BY m.[CreatedAt] DESC;
END
GO
*/

/*
================================================================================
  End of stored procedures document (no required procedures for RecycleHub.API)
================================================================================
*/
