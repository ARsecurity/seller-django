package ng.seller.customer;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiClient {

    private static final String BASE_URL =
            "https://seller-zamfara-api.onrender.com/api/";

    public interface Callback {
        void onSuccess(String response);
        void onError(String error);
    }

    public static void get(String endpoint, String token, Callback callback) {
        request("GET", endpoint, null, token, callback);
    }

    public static void post(String endpoint, String json, String token, Callback callback) {
        request("POST", endpoint, json, token, callback);
    }

    private static void request(
            String method,
            String endpoint,
            String json,
            String token,
            Callback callback
    ) {
        new Thread(() -> {
            HttpURLConnection connection = null;

            try {
                URL url = new URL(BASE_URL + endpoint);
                connection = (HttpURLConnection) url.openConnection();

                connection.setRequestMethod(method);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(20000);
                connection.setRequestProperty("Accept", "application/json");

                if (token != null && !token.isEmpty()) {
                    connection.setRequestProperty(
                            "Authorization",
                            "Token " + token
                    );
                }

                if (json != null) {
                    connection.setRequestProperty(
                            "Content-Type",
                            "application/json"
                    );
                    connection.setDoOutput(true);

                    try (OutputStream output = connection.getOutputStream()) {
                        output.write(json.getBytes("UTF-8"));
                    }
                }

                int statusCode = connection.getResponseCode();

                InputStream stream;

                if (statusCode >= 200 && statusCode < 300) {
                    stream = connection.getInputStream();
                } else {
                    stream = connection.getErrorStream();
                }

                String response = readStream(stream);

                if (statusCode >= 200 && statusCode < 300) {
                    callback.onSuccess(response);
                } else {
                    callback.onError(
                            "HTTP " + statusCode + ": " + response
                    );
                }

            } catch (Exception e) {
                callback.onError(e.getMessage() != null
                        ? e.getMessage()
                        : "Network error");
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    private static String readStream(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }

        StringBuilder result = new StringBuilder();

        try (BufferedReader reader =
                     new BufferedReader(new InputStreamReader(stream))) {

            String line;

            while ((line = reader.readLine()) != null) {
                result.append(line);
            }
        }

        return result.toString();
    }
}
