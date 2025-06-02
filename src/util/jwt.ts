import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (userId: string, role: string) => {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, process.env.SECRET_KEY as string, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.SECRET_KEY as string);
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
