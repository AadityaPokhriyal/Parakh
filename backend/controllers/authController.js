const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { privateKey } = require("../config/jwtKeys");

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

/**
 * Generates a signed JWT for the given user record.
 *
 * @param {Object} user - The user record from the database
 * @returns {string} Signed JWT token
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    privateKey,
    { algorithm: "RS256", expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Handles POST /api/auth/register
 *
 * 1. Validates required fields.
 * 2. Checks for duplicate email.
 * 3. Hashes password with bcrypt.
 * 4. Inserts new user into Supabase.
 * 5. Returns signed JWT and user profile.
 */
const register = async (req, res, next) => {
  const { email, password, name, institution, role } = req.body;

  console.log(`[Auth] >>> Incoming POST /api/auth/register. Email: ${email || "undefined"}`);

  try {
    // Check if new user registration is enabled via environment variable
    const allowRegistration = process.env.ALLOW_REGISTRATION
      ? !["false", "0", "closed", "disabled", "off"].includes(process.env.ALLOW_REGISTRATION.toLowerCase().trim())
      : true;

    if (!allowRegistration) {
      return res.status(403).json({
        success: false,
        error: "User registration is currently closed for testing purposes. Please contact your administrator if you require access.",
      });
    }

    // Validate required fields
    if (!email || !password || !name || !institution) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password, name, and institution are all required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long.",
      });
    }

    if (!supabase) {
      const configError = new Error("Database configuration is missing.");
      configError.statusCode = 500;
      throw configError;
    }

    // Check for duplicate email
    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (lookupError) {
      console.error(`[Auth] [DB ERROR] => ${lookupError.message}`);
      const dbError = new Error(`Database error: ${lookupError.message}`);
      dbError.statusCode = 500;
      throw dbError;
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: name.trim(),
        institution: institution.trim(),
        role: role || "Teacher",
      })
      .select("id, email, name, institution, role, created_at")
      .single();

    if (insertError) {
      console.error(`[Auth] [DB ERROR] => ${insertError.message}`);
      const dbError = new Error(`Database error: ${insertError.message}`);
      dbError.statusCode = 500;
      throw dbError;
    }

    const token = signToken(newUser);

    console.log(`[Auth] <<< Account created. User ID: ${newUser.id}`);
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        institution: newUser.institution,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(`[Auth] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

/**
 * Handles POST /api/auth/login
 *
 * 1. Validates email and password.
 * 2. Fetches user from Supabase by email.
 * 3. Compares password with bcrypt.
 * 4. Returns signed JWT and user profile.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  console.log(`[Auth] >>> Incoming POST /api/auth/login. Email: ${email || "undefined"}`);

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    if (!supabase) {
      const configError = new Error("Database configuration is missing.");
      configError.statusCode = 500;
      throw configError;
    }

    // Fetch user by email
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, password_hash, name, institution, role")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (fetchError) {
      console.error(`[Auth] [DB ERROR] => ${fetchError.message}`);
      const dbError = new Error(`Database error: ${fetchError.message}`);
      dbError.statusCode = 500;
      throw dbError;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const token = signToken(user);

    console.log(`[Auth] <<< Login successful. User ID: ${user.id}`);
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        institution: user.institution,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`[Auth] [FATAL ERROR] => ${error.message}`);
    next(error);
  }
};

module.exports = { register, login };
