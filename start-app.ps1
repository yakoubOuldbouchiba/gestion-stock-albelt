$javaPath = "C:\Users\y-bouchiba\.jdks\ms-17.0.18\bin\java.exe"
$cp = @(
    "D:\projects\my_projects\Gestion_Stock_ALBEL\albelt-api\target\classes",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot-starter-web\3.2.5\spring-boot-starter-web-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot-starter\3.2.5\spring-boot-starter-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot\3.2.5\spring-boot-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot-autoconfigure\3.2.5\spring-boot-autoconfigure-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot-starter-logging\3.2.5\spring-boot-starter-logging-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\ch\qos\logback\logback-classic\1.4.14\logback-classic-1.4.14.jar",
    "C:\Users\y-bouchiba\.m2\repository\ch\qos\logback\logback-core\1.4.14\logback-core-1.4.14.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\slf4j\slf4j-api\2.0.13\slf4j-api-2.0.13.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\spring-web\6.1.6\spring-web-6.1.6.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\spring-beans\6.1.6\spring-beans-6.1.6.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\spring-webmvc\6.1.6\spring-webmvc-6.1.6.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\spring-context\6.1.6\spring-context-6.1.6.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\spring-core\6.1.6\spring-core-6.1.6.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\boot\spring-boot-starter-data-jpa\3.2.5\spring-boot-starter-data-jpa-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\data\spring-data-jpa\3.2.5\spring-data-jpa-3.2.5.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\hibernate\orm\hibernate-core\6.4.4.Final\hibernate-core-6.4.4.Final.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\postgresql\postgresql\42.6.2\postgresql-42.6.2.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\flywaydb\flyway-core\9.22.3\flyway-core-9.22.3.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\security\spring-security-web\6.2.4\spring-security-web-6.2.4.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\springframework\security\spring-security-core\6.2.4\spring-security-core-6.2.4.jar",
    "C:\Users\y-bouchiba\.m2\repository\org\projectlombok\lombok\1.18.32\lombok-1.18.32.jar"
) -join ";"

Write-Host "Starting ALBEL API Application..."
Write-Host "Java Path: $javaPath"
Write-Host ""

& $javaPath -XX:TieredStopAtLevel=1 -Dspring.output.ansi.enabled=always -Dfile.encoding=UTF-8 -cp $cp com.albelt.AlbeltApiApplication
