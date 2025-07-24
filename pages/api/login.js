// pages/api/login.js

// Mock user credentials for testing
const mockUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In production, this would be hashed
    email: "admin@example.com",
    role: "admin"
  },
  {
    id: 2,
    username: "user",
    password: "user123", // In production, this would be hashed
    email: "user@example.com",
    role: "user"
  },
  {
    id: 3,
    username: "demo",
    password: "demo123", // In production, this would be hashed
    email: "demo@example.com",
    role: "user"
  }
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: "Missing credentials",
        message: "Username and password are required" 
      });
    }

    // Find user in mock database
    const user = mockUsers.find(u => 
      u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({ 
        error: "Invalid credentials",
        message: "Invalid username or password" 
      });
    }

    // In a real application, you would:
    // 1. Hash and compare passwords
    // 2. Generate a JWT token
    // 3. Set secure cookies
    // 4. Log the login attempt

    // Return success response with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      // In production, include a JWT token here
      token: `mock-jwt-token-${user.id}-${Date.now()}`
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: "An error occurred during login" 
    });
  }
}