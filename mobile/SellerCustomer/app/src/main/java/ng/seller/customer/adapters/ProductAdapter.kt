package ng.seller.customer.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import ng.seller.customer.R
import ng.seller.customer.models.Product
import java.util.Locale

class ProductAdapter(
    private val products: List<Product>,
    private val onProductClick: (Product) -> Unit
) : RecyclerView.Adapter<ProductAdapter.ProductViewHolder>() {

    class ProductViewHolder(view: View) :
        RecyclerView.ViewHolder(view) {

        val image: ImageView =
            view.findViewById(R.id.productImage)

        val name: TextView =
            view.findViewById(R.id.productName)

        val price: TextView =
            view.findViewById(R.id.productPrice)

        val meta: TextView =
            view.findViewById(R.id.productMeta)
    }

    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): ProductViewHolder {

        val view = LayoutInflater.from(parent.context)
            .inflate(
                R.layout.item_product,
                parent,
                false
            )

        return ProductViewHolder(view)
    }

    override fun onBindViewHolder(
        holder: ProductViewHolder,
        position: Int
    ) {
        val product = products[position]

        holder.name.text = product.name

        holder.price.text =
            String.format(
                Locale.US,
                "₦%,.0f",
                product.currentPrice
            )

        holder.meta.text =
            "⭐ %.1f  •  %d sold".format(
                product.ratingAvg,
                product.sold
            )

        if (!product.imageUrl.isNullOrBlank()) {
            Glide.with(holder.image.context)
                .load(product.imageUrl)
                .centerCrop()
                .placeholder(android.R.drawable.ic_menu_gallery)
                .error(android.R.drawable.ic_menu_report_image)
                .into(holder.image)
        } else {
            holder.image.setImageResource(
                android.R.drawable.ic_menu_gallery
            )
        }

        holder.itemView.setOnClickListener {
            onProductClick(product)
        }
    }

    override fun getItemCount(): Int =
        products.size
}
