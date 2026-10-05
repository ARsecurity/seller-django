package ng.seller.customer

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)

        statusText.text = "Connecting to Seller..."

        ApiClient.get("home/", null, object : ApiClient.Callback {

            override fun onSuccess(response: String) {
                runOnUiThread {
                    try {
                        val json = JSONObject(response)

                        val deals = json.optJSONArray("deals")
                        val trending = json.optJSONArray("trending")

                        val dealCount = deals?.length() ?: 0
                        val trendingCount = trending?.length() ?: 0

                        statusText.text =
                            "Connected successfully!\n\n" +
                            "Deals: $dealCount\n" +
                            "Trending: $trendingCount"
                    } catch (e: Exception) {
                        statusText.text =
                            "Connected, but response could not be read.\n\n${e.message}"
                    }
                }
            }

            override fun onError(error: String) {
                runOnUiThread {
                    statusText.text =
                        "Connection failed:\n\n$error"
                }
            }
        })
    }
}

