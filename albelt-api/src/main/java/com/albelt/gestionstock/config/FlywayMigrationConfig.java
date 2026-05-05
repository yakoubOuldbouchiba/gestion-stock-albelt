package com.albelt.gestionstock.config;

import com.albelt.gestionstock.shared.migration.MigrationService;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayMigrationConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(MigrationService migrationService) {
        return migrationService::executeMigrations;
    }
}