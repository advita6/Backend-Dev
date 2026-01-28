import java.io.*;
import java.util.stream.Stream;

public class LogAnalyzer {

    public static void main(String[] args) {
        String logFile = "log.txt";
        int errorCount = 0;
        int warningCount = 0;
        int totalLines = 0;

        try (BufferedReader br = new BufferedReader(new FileReader(logFile))) {
            Stream<String> lines = br.lines();
            String[] allLines = lines.toArray(String[]::new);

            totalLines = allLines.length;

            for (String line : allLines) {
                if (line.contains("ERROR"))
                    errorCount++;
                else if (line.contains("WARNING"))
                    warningCount++;
            }

            System.out.println("--- LOG REPORT ---");
            System.out.println("Total Entries: " + totalLines);
            System.out.println("Errors: " + errorCount);
            System.out.println("Warnings: " + warningCount);

        } catch (IOException e) {
            System.out.println("Error reading log file.");
        }
    }
}
