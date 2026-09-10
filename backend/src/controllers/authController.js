const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const namePattern =
  /^[A-Za-z][A-Za-z\s'-]*$/;

const specialCharacterPattern =
  /[!@#$%^&*(),.?":{}|<>_\-+=]/;

const validateRegistration = (
  name,
  email,
  password
) => {
  const cleanName =
    typeof name === "string"
      ? name.trim()
      : "";

  const cleanEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  if (cleanName.length < 2) {
    return {
      error:
        "Name must contain at least 2 characters.",
    };
  }

  if (cleanName.length > 50) {
    return {
      error:
        "Name must be 50 characters or fewer.",
    };
  }

  if (!namePattern.test(cleanName)) {
    return {
      error:
        "Name can contain letters, spaces, apostrophes and hyphens only.",
    };
  }

  if (!emailPattern.test(cleanEmail)) {
    return {
      error:
        "Enter a valid email address.",
    };
  }

  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    return {
      error:
        "Password must contain at least 8 characters.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      error:
        "Password must contain an uppercase letter.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      error:
        "Password must contain a lowercase letter.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      error:
        "Password must contain a number.",
    };
  }

  if (
    !specialCharacterPattern.test(password)
  ) {
    return {
      error:
        "Password must contain a special character.",
    };
  }

  return {
    cleanName,
    cleanEmail,
  };
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body || {};

    const validation =
      validateRegistration(
        name,
        email,
        password
      );

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const {
      cleanName,
      cleanEmail,
    } = validation;

    // Check existing email without
    // depending on letter casing.
    const userExists =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [cleanEmail]
      );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const salt =
      await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    const newUser =
      await pool.query(
        `
        INSERT INTO users
          (name, email, password)
        VALUES
          ($1, $2, $3)
        RETURNING
          id,
          name,
          email
        `,
        [
          cleanName,
          cleanEmail,
          hashedPassword,
        ]
      );

    return res.status(201).json({
      success: true,
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error(
      "Register Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      !emailPattern.test(cleanEmail) ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [cleanEmail]
      );

    if (user.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.rows[0].password
      );

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};