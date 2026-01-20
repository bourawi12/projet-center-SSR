package spring.jpa.dto;

public class LoginRequest {
    private String username;
    private String password;

    // Must have a no-arg constructor for Jackson
    public LoginRequest() {}

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}