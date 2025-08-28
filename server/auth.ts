import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

// Middleware for local admin authentication
export const isLocalAdmin: RequestHandler = async (req: any, res, next) => {
  if (req.session.localAdminId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware for guest users
export const isGuest: RequestHandler = async (req: any, res, next) => {
  if (req.session.guestUserId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware for any authenticated user (admin or guest)
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (req.session.localAdminId || req.session.guestUserId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};