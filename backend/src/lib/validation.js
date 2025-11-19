import { body, validationResult } from "express-validator";

// Password strength validation
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

// Validation middleware for signup
export const signupValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Full name can only contain letters, spaces, hyphens, and apostrophes"),
  body("password")
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

// Validation middleware for login
export const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation middleware for onboarding
export const onboardingValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("bio")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters")
    .customSanitizer((value) => sanitizeInput(value)),
  body("location")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters")
    .customSanitizer((value) => sanitizeInput(value)),
  body("nativeLanguage").notEmpty().withMessage("Native language is required"),
  body("learningLanguage").notEmpty().withMessage("Learning language is required"),
];

// Validation middleware for profile update
export const profileUpdateValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters")
    .customSanitizer((value) => sanitizeInput(value)),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters")
    .customSanitizer((value) => sanitizeInput(value)),
];

// Validation middleware for password reset request
export const passwordResetRequestValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
];

// Validation middleware for password reset
export const passwordResetValidation = [
  body("password")
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  body("token").notEmpty().withMessage("Reset token is required"),
];

// Middleware to check validation results
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}
