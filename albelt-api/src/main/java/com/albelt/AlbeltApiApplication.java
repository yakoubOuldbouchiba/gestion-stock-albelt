package com.albelt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class AlbeltApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlbeltApiApplication.class, args);
	}

}
