import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String plainPassword = "P@ssw0rd";
        String storedHash = "$2a$10$YNBj7CY1YsPB.dP0dJJzOuF5g7PKUGGJqE0gGiGmrckJUKe8z1vKC";
        
        System.out.println("Plain password: " + plainPassword);
        System.out.println("Stored hash: " + storedHash);
        System.out.println("Password matches: " + encoder.matches(plainPassword, storedHash));
        
        // Generate a new hash for testing
        String newHash = encoder.encode(plainPassword);
        System.out.println("New hash: " + newHash);
        System.out.println("New hash matches: " + encoder.matches(plainPassword, newHash));
    }
}
