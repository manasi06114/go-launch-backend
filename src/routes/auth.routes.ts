import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { getMongoDb } from "../data/mongodb.js";
import { loginSchema, signupSchema } from "../schemas/auth.schema.js";

type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const authRouter = Router();

function toSafeUser(user: UserDoc) {
  return {
    id: user._id.toHexString(),
    email: user.email
  };
}

function signToken(user: UserDoc): string {
  const expiresIn = env.AUTH_TOKEN_TTL as jwt.SignOptions["expiresIn"];

  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: user._id.toHexString(),
    expiresIn
  });
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    const payload = signupSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const db = await getMongoDb();
    const users = db.collection<UserDoc>("user_accounts");

    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user: UserDoc = {
      _id: new ObjectId(),
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    await users.insertOne(user);
    const token = signToken(user);

    res.status(201).json({
      token,
      user: toSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const db = await getMongoDb();
    const users = db.collection<UserDoc>("user_accounts");

    const user = await users.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const passwordOk = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordOk) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = signToken(user);
    res.status(200).json({
      token,
      user: toSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const db = await getMongoDb();
    const users = db.collection<UserDoc>("user_accounts");
    const user = await users.findOne({ _id: new ObjectId(req.auth.userId) });

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    res.status(200).json({ user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
});

export { authRouter };