import type { Express } from "express";
import { authStorage } from "./storage";
import bcrypt from "bcryptjs";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.json({ user: null });
      }
      
      // Handle Replit Auth users (have claims)
      if (req.user.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await authStorage.getUser(userId);
        return res.json({ user });
      }
      
      // Handle local auth users
      return res.json({ user: req.user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Log in the user
      const sessionUser = { id: user.id, username: user.email, email: user.email };
      req.login(sessionUser, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ user: { id: user.id, username: user.email, email: user.email } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Email/Password Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user exists
      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "User already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const userId = `local_${Date.now()}`;
      const [firstName, ...lastParts] = (fullName || email.split("@")[0]).split(" ");
      const lastName = lastParts.join(" ") || "";
      
      await authStorage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        profileImageUrl: null,
        passwordHash,
      });

      const user = await authStorage.getUser(userId);
      
      // Log in the user
      const sessionUser = { id: userId, username: email, email };
      req.login(sessionUser, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Registration failed" });
        }
        res.json({ user: { id: userId, username: email, email } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Logout (for local auth)
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}
