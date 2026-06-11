using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecycleHub.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMaterialsSellerProfileDuplicateFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Materials_SellerProfiles_SellerUserId",
                table: "Materials");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddForeignKey(
                name: "FK_Materials_SellerProfiles_SellerUserId",
                table: "Materials",
                column: "SellerUserId",
                principalTable: "SellerProfiles",
                principalColumn: "SellerProfileId");
        }
    }
}
