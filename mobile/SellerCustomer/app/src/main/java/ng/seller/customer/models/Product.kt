package ng.seller.customer.models

data class Product(
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val salePrice: Double?,
    val currentPrice: Double,
    val imageUrl: String?,
    val stock: Int,
    val sold: Int,
    val ratingAvg: Double,
    val ratingCount: Int,
    val discountPct: Double,
    val category: Int?,
    val shop: String?,
    val sourceShopName: String?,
    val sourceShopAddress: String?,
    val sourceShopPhone: String?,
    val sourceShopEmail: String?,
    val sourceShopDescription: String?
)
