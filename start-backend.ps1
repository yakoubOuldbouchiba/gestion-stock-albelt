powershell -ExecutionPolicy Bypass -Command {
    # Collect all JARs from .m2 repository
    $m2Path = "C:\Users\y-bouchiba\.m2\repository"
    $jars = Get-ChildItem -Path $m2Path -Recurse -Filter "*.jar" | Where-Object {
        $_.FullName -match "(spring|jackson|postgresql|flyway|logback|hibernate|jakarta|tomcat|jboss|junit|org\.yaml|commons)" 
    } | Select-Object -ExpandProperty FullName
    
    $classpath = "D:\projects\my_projects\Gestion_Stock_ALBEL\albelt-api\target\classes"
    foreach ($jar in $jars) {
        $classpath += ";$jar"
    }
    
    Set-Location D:\projects\my_projects\Gestion_Stock_ALBEL\albelt-api
    
    $javaPath = "C:\Users\y-bouchiba\.jdks\ms-17.0.18\bin\java.exe"
    & $javaPath -XX:TieredStopAtLevel=1 `
        -Dspring.output.ansi.enabled=always `
        -Dfile.encoding=UTF-8 `
        -cp $classpath `
        com.albelt.AlbeltApiApplication
}
