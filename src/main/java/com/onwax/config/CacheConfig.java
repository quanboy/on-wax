package com.onwax.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Primary
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("nowPlaying");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(4, TimeUnit.SECONDS)
                .maximumSize(500));
        return cacheManager;
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
    }
}
