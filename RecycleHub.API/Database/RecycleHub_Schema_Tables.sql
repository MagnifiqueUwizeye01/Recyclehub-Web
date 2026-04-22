/*
================================================================================
  RecycleHub — SQL Server table definitions
================================================================================
  Derived from: RecycleHub.API (Entity Framework Core models + Data/Configurations)
  Target:       Microsoft SQL Server

  Notes for your team
  ---------------------
  • String enums are stored as Pascal-case names (e.g. Buyer, Active, Pending)
    matching C# enum members — see JsonStringEnumConverter in Program.cs.
  • Use the same connection string as appsettings.json / appsettings.Development.json
    (ConnectionStrings / DefaultConnection).
  • Intended for a new database or as a reference when aligning an existing DB
    with the API. If you already use EF migrations, prefer migrations as source of
    truth and diff against this script.

  Suggested execution order: run this script top-to-bottom on an empty database.
================================================================================
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ── 1. Users ───────────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Users] (
    [UserId]                         INT            NOT NULL IDENTITY(1,1),
    [Username]                       NVARCHAR(60)   NOT NULL,
    [FirstName]                      NVARCHAR(100)  NOT NULL,
    [LastName]                       NVARCHAR(100)  NOT NULL,
    [Gender]                         NVARCHAR(10)   NOT NULL,  /* Male, Female */
    [Email]                          NVARCHAR(255)  NOT NULL,
    [PasswordHash]                   NVARCHAR(512)  NOT NULL,
    [PhoneNumber]                    NVARCHAR(20)   NULL,
    [Role]                           NVARCHAR(10)   NOT NULL,  /* Buyer, Seller, Admin */
    [Status]                         NVARCHAR(15)   NOT NULL
        CONSTRAINT [DF_Users_Status] DEFAULT (N'Pending'),     /* Active, Pending, Suspended */
    [ProfileImageUrl]                NVARCHAR(500)  NULL,
    [LastLoginAt]                    DATETIME2(7)   NULL,
    [CreatedAt]                      DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_Users_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]                      DATETIME2(7)   NULL,
    [RefreshToken]                   NVARCHAR(512)  NULL,
    [RefreshTokenExpiry]             DATETIME2(7)   NULL,
    [PasswordResetOtpHash]           NVARCHAR(256)  NULL,
    [PasswordResetOtpExpiresAt]      DATETIME2(7)   NULL,
    [TwoFactorEnabled]               BIT            NOT NULL
        CONSTRAINT [DF_Users_TwoFactorEnabled] DEFAULT ((0)),
    [TwoFactorSecret]                NVARCHAR(80)   NULL,
    [TwoFactorLoginChallenge]        NVARCHAR(256)  NULL,
    [TwoFactorLoginChallengeExpiresAt] DATETIME2(7) NULL,
    [TwoFactorLoginEmailOtpHash]     NVARCHAR(256)  NULL,
    [TwoFactorLoginEmailOtpExpiresAt] DATETIME2(7)  NULL,
    [TwoFactorSetupEmailOtpHash]     NVARCHAR(256)  NULL,
    [TwoFactorSetupEmailOtpExpiresAt] DATETIME2(7) NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserId] ASC)
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Username] ON [dbo].[Users]([Username] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Email]    ON [dbo].[Users]([Email] ASC);
GO

/* ── 2. BuyerProfiles (1:1 with User for buyers) ─────────────────────────── */
CREATE TABLE [dbo].[BuyerProfiles] (
    [BuyerProfileId] INT            NOT NULL IDENTITY(1,1),
    [UserId]         INT            NOT NULL,
    [CompanyName]    NVARCHAR(255)  NOT NULL,
    [IndustryType]   NVARCHAR(150)  NOT NULL,
    [City]           NVARCHAR(100)  NOT NULL,
    [Address]        NVARCHAR(500)  NOT NULL,
    [WebsiteUrl]     NVARCHAR(500)  NULL,
    [Description]    NVARCHAR(1000) NULL,
    [CreatedAt]      DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_BuyerProfiles_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]      DATETIME2(7)   NULL,
    CONSTRAINT [PK_BuyerProfiles] PRIMARY KEY CLUSTERED ([BuyerProfileId] ASC),
    CONSTRAINT [FK_BuyerProfiles_Users_UserId] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_BuyerProfiles_UserId] ON [dbo].[BuyerProfiles]([UserId] ASC);
GO

/* ── 3. SellerProfiles (1:1 with User for sellers) ───────────────────────── */
CREATE TABLE [dbo].[SellerProfiles] (
    [SellerProfileId]    INT            NOT NULL IDENTITY(1,1),
    [UserId]             INT            NOT NULL,
    [CompanyName]        NVARCHAR(255)  NOT NULL,
    [LicenseDocument]    NVARCHAR(500)  NOT NULL,
    [VerificationStatus] NVARCHAR(15)  NOT NULL
        CONSTRAINT [DF_SellerProfiles_VerificationStatus] DEFAULT (N'Pending'), /* Pending, Verified, Rejected */
    [VerificationNote]   NVARCHAR(1000) NULL,
    [VerifiedAt]         DATETIME2(7)   NULL,
    [VerifiedByAdminId]  INT            NULL,
    [City]               NVARCHAR(100)  NOT NULL,
    [Address]            NVARCHAR(500)  NOT NULL,
    [WebsiteUrl]         NVARCHAR(500)  NULL,
    [Description]        NVARCHAR(1000) NULL,
    [TotalSales]         INT            NOT NULL
        CONSTRAINT [DF_SellerProfiles_TotalSales] DEFAULT ((0)),
    [AverageRating]      DECIMAL(3,2)   NOT NULL
        CONSTRAINT [DF_SellerProfiles_AverageRating] DEFAULT ((0.00)),
    [CreatedAt]          DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_SellerProfiles_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]          DATETIME2(7)   NULL,
    CONSTRAINT [PK_SellerProfiles] PRIMARY KEY CLUSTERED ([SellerProfileId] ASC),
    CONSTRAINT [FK_SellerProfiles_Users_UserId] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE,
    CONSTRAINT [FK_SellerProfiles_Users_VerifiedByAdminId] FOREIGN KEY ([VerifiedByAdminId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_SellerProfiles_UserId] ON [dbo].[SellerProfiles]([UserId] ASC);
GO

/* ── 4. Materials ────────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Materials] (
    [MaterialId]          INT             NOT NULL IDENTITY(1,1),
    [SellerUserId]        INT             NOT NULL,
    [Title]               NVARCHAR(255)   NOT NULL,
    [Description]         NVARCHAR(2000)  NULL,
    [MaterialType]        NVARCHAR(20)    NOT NULL,
        /* Metal, Textile, Electronics, Plastic, Paper, Glass, Other */
    [Quantity]            DECIMAL(18,4)   NOT NULL,
    [UnitPrice]           DECIMAL(18,2)   NOT NULL,
    [Unit]                NVARCHAR(30)    NOT NULL,
    [MinOrderQty]         DECIMAL(18,4)   NOT NULL
        CONSTRAINT [DF_Materials_MinOrderQty] DEFAULT ((1)),
    [City]                NVARCHAR(100)   NOT NULL,
    [Address]             NVARCHAR(500)   NOT NULL,
    [Grade]               NVARCHAR(50)    NULL,
    [Status]              NVARCHAR(15)    NOT NULL
        CONSTRAINT [DF_Materials_Status] DEFAULT (N'Available'),
        /* Pending, Verified, Rejected, Available, Sold */
    [AdminNote]           NVARCHAR(1000)  NULL,
    [VerifiedAt]          DATETIME2(7)    NULL,
    [VerifiedByAdminId]   INT             NULL,
    [ViewCount]           INT             NOT NULL
        CONSTRAINT [DF_Materials_ViewCount] DEFAULT ((0)),
    [IsSmartSwap]         BIT             NOT NULL
        CONSTRAINT [DF_Materials_IsSmartSwap] DEFAULT ((0)),
    [SmartSwapDescription] NVARCHAR(2000) NULL,
    [CreatedAt]           DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Materials_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]           DATETIME2(7)    NULL,
    CONSTRAINT [PK_Materials] PRIMARY KEY CLUSTERED ([MaterialId] ASC),
    CONSTRAINT [FK_Materials_Users_SellerUserId] FOREIGN KEY ([SellerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Materials_Users_VerifiedByAdminId] FOREIGN KEY ([VerifiedByAdminId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

/* ── 5. MaterialImages ───────────────────────────────────────────────────── */
CREATE TABLE [dbo].[MaterialImages] (
    [ImageId]     INT            NOT NULL IDENTITY(1,1),
    [MaterialId]  INT            NOT NULL,
    [ImageUrl]    NVARCHAR(500)  NOT NULL,
    [IsPrimary]   BIT            NOT NULL
        CONSTRAINT [DF_MaterialImages_IsPrimary] DEFAULT ((0)),
    [SortOrder]   INT            NOT NULL
        CONSTRAINT [DF_MaterialImages_SortOrder] DEFAULT ((0)),
    [UploadedAt]  DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_MaterialImages_UploadedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_MaterialImages] PRIMARY KEY CLUSTERED ([ImageId] ASC),
    CONSTRAINT [FK_MaterialImages_Materials_MaterialId] FOREIGN KEY ([MaterialId])
        REFERENCES [dbo].[Materials] ([MaterialId]) ON DELETE CASCADE
);
GO

/* ── 6. AIAnalysisResults ─────────────────────────────────────────────────── */
CREATE TABLE [dbo].[AIAnalysisResults] (
    [AnalysisId]          INT             NOT NULL IDENTITY(1,1),
    [MaterialId]          INT             NOT NULL,
    [RequestedByUserId]   INT             NOT NULL,
    [DetectedType]        NVARCHAR(100)   NULL,
    [PredictedGrade]      NVARCHAR(50)    NULL,
    [ConfidenceScore]     DECIMAL(5,2)    NULL,
    [RecyclabilityScore]  DECIMAL(5,2)    NULL,
    [SuggestedPrice]      DECIMAL(18,2)   NULL,
    [Notes]               NVARCHAR(2000)  NULL,
    [RawAIResponse]       NVARCHAR(MAX)   NULL,
    [AnalyzedAt]          DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_AIAnalysisResults_AnalyzedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_AIAnalysisResults] PRIMARY KEY CLUSTERED ([AnalysisId] ASC),
    CONSTRAINT [FK_AIAnalysisResults_Materials_MaterialId] FOREIGN KEY ([MaterialId])
        REFERENCES [dbo].[Materials] ([MaterialId]) ON DELETE CASCADE,
    CONSTRAINT [FK_AIAnalysisResults_Users_RequestedByUserId] FOREIGN KEY ([RequestedByUserId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

/* ── 7. Orders ────────────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Orders] (
    [OrderId]             INT             NOT NULL IDENTITY(1,1),
    [BuyerUserId]         INT             NOT NULL,
    [SellerUserId]        INT             NOT NULL,
    [MaterialId]          INT             NOT NULL,
    [QuantityOrdered]     DECIMAL(18,4)   NOT NULL,
    [OfferedUnitPrice]    DECIMAL(18,2)   NOT NULL,
    [TotalAmount]         DECIMAL(18,2)   NOT NULL,
    [Currency]            NVARCHAR(10)    NOT NULL
        CONSTRAINT [DF_Orders_Currency] DEFAULT (N'RWF'),
    [Status]              NVARCHAR(24)    NOT NULL
        CONSTRAINT [DF_Orders_Status] DEFAULT (N'Pending'),
        /* AwaitingPayment, Pending, Accepted, Rejected, Paid, Shipped, Delivered, Cancelled */
    [BuyerNote]           NVARCHAR(1000)  NULL,
    [SellerNote]          NVARCHAR(1000)  NULL,
    [ShippingAddress]     NVARCHAR(500)   NULL,
    [ExpectedDeliveryAt]  DATETIME2(7)    NULL,
    [DeliveredAt]         DATETIME2(7)    NULL,
    [CancelledAt]         DATETIME2(7)    NULL,
    [CancelReason]        NVARCHAR(500)   NULL,
    [OrderDate]           DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Orders_OrderDate] DEFAULT (GETUTCDATE()),
    [UpdatedAt]           DATETIME2(7)    NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED ([OrderId] ASC),
    CONSTRAINT [FK_Orders_Users_BuyerUserId] FOREIGN KEY ([BuyerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Orders_Users_SellerUserId] FOREIGN KEY ([SellerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Orders_Materials_MaterialId] FOREIGN KEY ([MaterialId])
        REFERENCES [dbo].[Materials] ([MaterialId])
);
GO

/* ── 8. Payments (1:1 with Order) ─────────────────────────────────────────── */
CREATE TABLE [dbo].[Payments] (
    [PaymentId]               INT             NOT NULL IDENTITY(1,1),
    [OrderId]                 INT             NOT NULL,
    [BuyerUserId]             INT             NOT NULL,
    [Amount]                  DECIMAL(18,2)   NOT NULL,
    [PaymentMethod]           NVARCHAR(20)    NOT NULL
        CONSTRAINT [DF_Payments_PaymentMethod] DEFAULT (N'MobileMoney'),
    [PhoneNumber]             NVARCHAR(20)    NOT NULL,
    [Currency]                NVARCHAR(10)    NOT NULL
        CONSTRAINT [DF_Payments_Currency] DEFAULT (N'RWF'),
    [ExternalReference]       NVARCHAR(255)   NULL,
    [MoMoReferenceId]         NVARCHAR(255)   NULL,
    [FinancialTransactionId]  NVARCHAR(255)   NULL,
    [PaymentStatus]           NVARCHAR(15)    NOT NULL
        CONSTRAINT [DF_Payments_PaymentStatus] DEFAULT (N'Pending'),
        /* Pending, Requested, Successful, Failed, Cancelled, Expired */
    [RequestMessage]          NVARCHAR(500)   NULL,
    [FailureReason]           NVARCHAR(500)   NULL,
    [RequestedAt]             DATETIME2(7)    NULL,
    [PaidAt]                  DATETIME2(7)    NULL,
    [CreatedAt]               DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Payments_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]               DATETIME2(7)    NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([PaymentId] ASC),
    CONSTRAINT [FK_Payments_Orders_OrderId] FOREIGN KEY ([OrderId])
        REFERENCES [dbo].[Orders] ([OrderId]),
    CONSTRAINT [FK_Payments_Users_BuyerUserId] FOREIGN KEY ([BuyerUserId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Payments_OrderId] ON [dbo].[Payments]([OrderId] ASC);
GO

/* ── 9. Messages ───────────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Messages] (
    [MessageId]       INT             NOT NULL IDENTITY(1,1),
    [SenderUserId]    INT             NOT NULL,
    [ReceiverUserId]  INT             NOT NULL,
    [OrderId]         INT             NULL,
    [MaterialId]      INT             NULL,
    [MessageType]     NVARCHAR(20)    NOT NULL
        CONSTRAINT [DF_Messages_MessageType] DEFAULT (N'General'),
        /* General, Order, Material, AdminNotice */
    [MessageText]     NVARCHAR(4000)  NOT NULL,
    [AttachmentUrl]   NVARCHAR(500)   NULL,
    [IsRead]          BIT             NOT NULL
        CONSTRAINT [DF_Messages_IsRead] DEFAULT ((0)),
    [ReadAt]          DATETIME2(7)    NULL,
    [SentAt]          DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Messages_SentAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Messages] PRIMARY KEY CLUSTERED ([MessageId] ASC),
    CONSTRAINT [FK_Messages_Users_SenderUserId] FOREIGN KEY ([SenderUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Messages_Users_ReceiverUserId] FOREIGN KEY ([ReceiverUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Messages_Orders_OrderId] FOREIGN KEY ([OrderId])
        REFERENCES [dbo].[Orders] ([OrderId]),
    CONSTRAINT [FK_Messages_Materials_MaterialId] FOREIGN KEY ([MaterialId])
        REFERENCES [dbo].[Materials] ([MaterialId])
);
GO

/* ── 10. Notifications ─────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Notifications] (
    [NotificationId]   INT             NOT NULL IDENTITY(1,1),
    [UserId]           INT             NOT NULL,
    [Title]            NVARCHAR(255)   NOT NULL,
    [Message]          NVARCHAR(1000)  NOT NULL,
    [NotificationType] NVARCHAR(20)    NOT NULL,
        /* Message, Order, Payment, Verification, System, AI, AdminNotice */
    [ReferenceId]      INT             NULL,
    [ReferenceTable]   NVARCHAR(50)    NULL,
    [ActionUrl]        NVARCHAR(500)   NULL,
    [IsRead]           BIT             NOT NULL
        CONSTRAINT [DF_Notifications_IsRead] DEFAULT ((0)),
    [ReadAt]           DATETIME2(7)    NULL,
    [CreatedAt]        DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Notifications_CreatedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([NotificationId] ASC),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
);
GO

/* ── 11. Reviews (1:1 with Order) ──────────────────────────────────────────── */
CREATE TABLE [dbo].[Reviews] (
    [ReviewId]          INT             NOT NULL IDENTITY(1,1),
    [OrderId]           INT             NOT NULL,
    [BuyerUserId]       INT             NOT NULL,
    [SellerUserId]      INT             NOT NULL,
    [Rating]            TINYINT         NOT NULL,
    [Comment]           NVARCHAR(2000)  NULL,
    [Status]            NVARCHAR(10)    NOT NULL
        CONSTRAINT [DF_Reviews_Status] DEFAULT (N'Visible'), /* Visible, Hidden */
    [HiddenReason]      NVARCHAR(500)   NULL,
    [HiddenByAdminId]   INT             NULL,
    [CreatedAt]         DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_Reviews_CreatedAt] DEFAULT (GETUTCDATE()),
    [UpdatedAt]         DATETIME2(7)    NULL,
    CONSTRAINT [PK_Reviews] PRIMARY KEY CLUSTERED ([ReviewId] ASC),
    CONSTRAINT [FK_Reviews_Orders_OrderId] FOREIGN KEY ([OrderId])
        REFERENCES [dbo].[Orders] ([OrderId]),
    CONSTRAINT [FK_Reviews_Users_BuyerUserId] FOREIGN KEY ([BuyerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Reviews_Users_SellerUserId] FOREIGN KEY ([SellerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Reviews_Users_HiddenByAdminId] FOREIGN KEY ([HiddenByAdminId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Reviews_OrderId] ON [dbo].[Reviews]([OrderId] ASC);
GO

/* ── 12. SmartSwapMatches ────────────────────────────────────────────────── */
CREATE TABLE [dbo].[SmartSwapMatches] (
    [MatchId]                INT             NOT NULL IDENTITY(1,1),
    [MaterialId]             INT             NOT NULL,
    [SuggestedBuyerUserId]   INT             NULL,
    [SuggestedSellerUserId]  INT             NULL,
    [MatchScore]             DECIMAL(5,2)    NOT NULL,
    [SuggestedReason]        NVARCHAR(1000)  NULL,
    [MatchStatus]            NVARCHAR(15)    NOT NULL
        CONSTRAINT [DF_SmartSwapMatches_MatchStatus] DEFAULT (N'Suggested'),
        /* Suggested, Viewed, Accepted, Rejected */
    [ViewedAt]               DATETIME2(7)    NULL,
    [RespondedAt]            DATETIME2(7)    NULL,
    [CreatedAt]              DATETIME2(7)    NOT NULL
        CONSTRAINT [DF_SmartSwapMatches_CreatedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_SmartSwapMatches] PRIMARY KEY CLUSTERED ([MatchId] ASC),
    CONSTRAINT [FK_SmartSwapMatches_Materials_MaterialId] FOREIGN KEY ([MaterialId])
        REFERENCES [dbo].[Materials] ([MaterialId]) ON DELETE CASCADE,
    CONSTRAINT [FK_SmartSwapMatches_Users_SuggestedBuyerUserId] FOREIGN KEY ([SuggestedBuyerUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_SmartSwapMatches_Users_SuggestedSellerUserId] FOREIGN KEY ([SuggestedSellerUserId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

/* ── 13. SellerCertificates ────────────────────────────────────────────────── */
CREATE TABLE [dbo].[SellerCertificates] (
    [SellerCertificateId] INT            NOT NULL IDENTITY(1,1),
    [SellerUserId]        INT            NOT NULL,
    [CertificateName]     NVARCHAR(255)  NOT NULL,
    [IssuingAuthority]    NVARCHAR(255)  NOT NULL,
    [IssueDate]           DATETIME2(7)   NOT NULL,
    [ExpiryDate]          DATETIME2(7)   NULL,
    [DocumentUrl]         NVARCHAR(500)  NOT NULL,
    [CreatedAt]           DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_SellerCertificates_CreatedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_SellerCertificates] PRIMARY KEY CLUSTERED ([SellerCertificateId] ASC),
    CONSTRAINT [FK_SellerCertificates_Users_SellerUserId] FOREIGN KEY ([SellerUserId])
        REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
);
GO

/* ── 14. CertificateUpdateRequests ─────────────────────────────────────────── */
CREATE TABLE [dbo].[CertificateUpdateRequests] (
    [RequestId]         INT            NOT NULL IDENTITY(1,1),
    [SellerUserId]      INT            NOT NULL,
    [CertificateName]   NVARCHAR(255)  NOT NULL,
    [IssuingAuthority]  NVARCHAR(255)  NOT NULL,
    [IssueDate]         DATETIME2(7)   NOT NULL,
    [ExpiryDate]        DATETIME2(7)   NULL,
    [DocumentUrl]       NVARCHAR(500)  NOT NULL,
    [Notes]             NVARCHAR(2000) NULL,
    [Status]            NVARCHAR(20)   NOT NULL
        CONSTRAINT [DF_CertificateUpdateRequests_Status] DEFAULT (N'Pending'),
        /* Pending, Approved, Rejected */
    [CreatedAt]         DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_CertificateUpdateRequests_CreatedAt] DEFAULT (GETUTCDATE()),
    [ReviewedAt]        DATETIME2(7)   NULL,
    CONSTRAINT [PK_CertificateUpdateRequests] PRIMARY KEY CLUSTERED ([RequestId] ASC),
    CONSTRAINT [FK_CertificateUpdateRequests_Users_SellerUserId] FOREIGN KEY ([SellerUserId])
        REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
);
GO

/* ── 15. Reports ───────────────────────────────────────────────────────────── */
CREATE TABLE [dbo].[Reports] (
    [ReportId]        INT            NOT NULL IDENTITY(1,1),
    [ReporterUserId]  INT            NOT NULL,
    [ReportedUserId]  INT            NOT NULL,
    [Reason]          NVARCHAR(500)  NOT NULL,
    [Details]         NVARCHAR(4000) NULL,
    [Context]         NVARCHAR(50)   NOT NULL,
    [Status]          NVARCHAR(20)   NOT NULL
        CONSTRAINT [DF_Reports_Status] DEFAULT (N'Pending'),
        /* Pending, Reviewed, ActionTaken, Dismissed */
    [CreatedAt]       DATETIME2(7)   NOT NULL
        CONSTRAINT [DF_Reports_CreatedAt] DEFAULT (GETUTCDATE()),
    [ReviewedAt]      DATETIME2(7)   NULL,
    CONSTRAINT [PK_Reports] PRIMARY KEY CLUSTERED ([ReportId] ASC),
    CONSTRAINT [FK_Reports_Users_ReporterUserId] FOREIGN KEY ([ReporterUserId])
        REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [FK_Reports_Users_ReportedUserId] FOREIGN KEY ([ReportedUserId])
        REFERENCES [dbo].[Users] ([UserId])
);
GO

/*
================================================================================
  End of table definitions
================================================================================
*/
