import java.io.*;
import java.util.Scanner;

public class FileManager {

    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {
        while (true) {
            System.out.println("\n--- FILE MANAGER ---");
            System.out.println("1. Read File");
            System.out.println("2. Write File");
            System.out.println("3. Copy File");
            System.out.println("4. Delete File");
            System.out.println("5. List Directory");
            System.out.println("6. Exit");
            System.out.print("Choose an option: ");

            int choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {
                case 1 -> readFile();
                case 2 -> writeFile();
                case 3 -> copyFile();
                case 4 -> deleteFile();
                case 5 -> listDirectory();
                case 6 -> {
                    System.out.println("Exiting...");
                    return;
                }
                default -> System.out.println("Invalid option!");
            }
        }
    }

    static void readFile() {
        try {
            System.out.print("Enter file path: ");
            String path = sc.nextLine();
            BufferedReader br = new BufferedReader(new FileReader(path));
            String line;
            while ((line = br.readLine()) != null)
                System.out.println(line);
            br.close();
        } catch (Exception e) {
            System.out.println("Error reading file.");
        }
    }

    static void writeFile() {
        try {
            System.out.print("Enter file path: ");
            String path = sc.nextLine();
            System.out.print("Enter text: ");
            String text = sc.nextLine();
            FileWriter fw = new FileWriter(path, true);
            fw.write(text + "\n");
            fw.close();
            System.out.println("Written successfully!");
        } catch (Exception e) {
            System.out.println("Error writing file.");
        }
    }

    static void copyFile() {
        try {
            System.out.print("Source file: ");
            String src = sc.nextLine();
            System.out.print("Destination file: ");
            String dest = sc.nextLine();

            FileInputStream fis = new FileInputStream(src);
            FileOutputStream fos = new FileOutputStream(dest);

            int ch;
            while ((ch = fis.read()) != -1)
                fos.write(ch);

            fis.close();
            fos.close();
            System.out.println("File copied successfully!");
        } catch (Exception e) {
            System.out.println("Error copying file.");
        }
    }

    static void deleteFile() {
        System.out.print("Enter file path: ");
        String path = sc.nextLine();
        File file = new File(path);
        if (file.delete())
            System.out.println("File deleted successfully!");
        else
            System.out.println("Deletion failed.");
    }

    static void listDirectory() {
        System.out.print("Enter directory path: ");
        String path = sc.nextLine();
        File dir = new File(path);
        String[] files = dir.list();
        if (files != null) {
            for (String f : files)
                System.out.println(f);
        } else {
            System.out.println("Invalid directory.");
        }
    }
}
