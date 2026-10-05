package ng.seller.customer.models

data class HomeResponse(
    val deals: List<Product>,
    val trending: List<Product>
)
