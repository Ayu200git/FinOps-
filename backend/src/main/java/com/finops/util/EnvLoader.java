package com.finops.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class EnvLoader {
    private static final String ENV_FILE_NAME = ".env";
    private static final Map<String, String> values = new HashMap<>();
    private static boolean loaded = false;

    public static synchronized void load() {
        if (loaded) {
            return;
        }

        File envFile = new File(ENV_FILE_NAME);
        if (!envFile.exists() || !envFile.isFile()) {
            loaded = true;
            return;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int idx = line.indexOf('=');
                String key = line.substring(0, idx).trim();
                String value = line.substring(idx + 1).trim();
                if (!key.isEmpty()) {
                    values.put(key, value);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        loaded = true;
    }

    public static String get(String key, String defaultValue) {
        load();
        return values.getOrDefault(key, System.getenv().getOrDefault(key, defaultValue));
    }
}
