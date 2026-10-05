package ng.seller.customer.api

import ng.seller.customer.models.HomeResponse
import ng.seller.customer.models.Product
import org.json.JSONArray
import org.json.JSONObject

object JsonParser {

    fun home(json: String): HomeResponse {
        val root = JSONObject(json)

        return HomeResponse(
            deals = products(root.optJSONArray("deals")),
            trending = products(root.optJSONArray("trending"))
        )
    }

    private fun products(array: JSONArray?): List<Product> {
        if (array == null) return emptyList()

        val result = mutableListOf<Product>()

        for (i in 0 until array.length()) {
            result.add(product(array.getJSONObject(i)))
        }

        return result
    }

    fun product(json: JSONObject): Product {
        val sourceShop =
            json.optJSONObject("source_shop_info")

        return Product(
            id = json.optInt("id"),
            name = json.optString("name"),
            description = json.optString("description"),
            price = json.optDouble("price", 0.0),
            salePrice = if (json.isNull("sale_price"))
                null
            else
                json.optDouble("sale_price"),

            currentPrice = json.optDouble(
                "current_price",
                json.optDouble("price", 0.0)
            ),

            imageUrl = json.optString("image_url")
                .takeIf { it.isNotBlank() },

            stock = json.optInt("stock"),
            sold = json.optInt("sold"),

            ratingAvg = json.optDouble("rating_avg", 0.0),
            ratingCount = json.optInt("rating_count"),

            discountPct = json.optDouble(
                "discount_pct",
                0.0
            ),

            category = if (json.isNull("category"))
                null
            else
                json.optInt("category"),

            shop = json.optString("shop")
                .takeIf { it.isNotBlank() },

            sourceShopName =
                sourceShop?.optString("name")
                    ?.takeIf { it.isNotBlank() },

            sourceShopAddress =
                sourceShop?.optString("address")
                    ?.takeIf { it.isNotBlank() },

            sourceShopPhone =
                sourceShop?.optString("phone")
                    ?.takeIf { it.isNotBlank() },

            sourceShopEmail =
                sourceShop?.optString("email")
                    ?.takeIf { it.isNotBlank() },

            sourceShopDescription =
                sourceShop?.optString("description")
                    ?.takeIf { it.isNotBlank() }
        )
    }
}
