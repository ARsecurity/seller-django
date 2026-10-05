package ng.seller.customer

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import ng.seller.customer.adapters.ProductAdapter
import ng.seller.customer.api.JsonParser

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var productRecycler: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.homeStatus)
        productRecycler = findViewById(R.id.productRecycler)

        setupRecycler()
        loadHome()
    }

    private fun setupRecycler() {
        productRecycler.layoutManager =
            GridLayoutManager(this, 2)
    }

    private fun loadHome() {

        statusText.text = "Loading products..."

        ApiClient.get(
            "home/",
            null,
            object : ApiClient.Callback {

                override fun onSuccess(response: String) {

                    runOnUiThread {

                        try {
                            val home =
                                JsonParser.home(response)

                            val products =
                                home.deals + home.trending

                            productRecycler.adapter =
                                ProductAdapter(
                                    products
                                ) {
                                    Toast.makeText(
                                        this@MainActivity,
                                        it.name,
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }

                            statusText.text =
                                "${products.size} products available"

                        } catch (e: Exception) {

                            statusText.text =
                                "Unable to read products"

                            Toast.makeText(
                                this@MainActivity,
                                e.message ?: "Unknown error",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                }

                override fun onError(error: String) {

                    runOnUiThread {

                        statusText.text =
                            "Unable to load products"

                        Toast.makeText(
                            this@MainActivity,
                            error,
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            }
        )
    }
}
