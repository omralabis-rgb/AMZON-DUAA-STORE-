import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export const PRIMARY_ADMIN_EMAIL = 'alabsiamal14@gmail.com';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export function isVerifiedAdminToken(decoded?: DecodedIdToken): boolean {
  if (!decoded) return false;
  const email = (decoded.email || '').trim().toLowerCase();
  const emailVerified = decoded.email_verified === true;
  const signInProvider = decoded.firebase?.sign_in_provider;

  return (
    email === PRIMARY_ADMIN_EMAIL &&
    emailVerified &&
    signInProvider === 'google.com'
  );
}

async function extractAndVerifyToken(req: Request): Promise<{
  decoded?: DecodedIdToken;
  status?: number;
  error?: string;
}> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, error: 'Unauthorized: Missing token' };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token === 'null' || token === 'undefined' || token.split('.').length !== 3) {
    return { status: 401, error: 'Unauthorized: Invalid token format' };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { decoded };
  } catch {
    return { status: 401, error: 'Unauthorized: Invalid token' };
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const result = await extractAndVerifyToken(req);
  if (!result.decoded) {
    return res.status(result.status || 401).json({ error: result.error || 'Unauthorized' });
  }
  req.user = result.decoded;
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const result = await extractAndVerifyToken(req);
  if (!result.decoded) {
    return res.status(result.status || 401).json({ error: result.error || 'Unauthorized' });
  }

  if (!isVerifiedAdminToken(result.decoded)) {
    if (result.decoded.admin === true || result.decoded.role === 'admin') {
      try {
        const userRecord = await adminAuth.getUser(result.decoded.uid);
        const currentClaims = { ...(userRecord.customClaims || {}) };
        delete currentClaims.admin;
        currentClaims.role = 'user';
        await adminAuth.setCustomUserClaims(result.decoded.uid, currentClaims);
      } catch {
        // Best-effort claim cleanup when Admin IAM write permissions are available
      }
    }

    return res.status(403).json({
      authorized: false,
      error: 'Forbidden: Admin access is restricted to the authorized Google account.',
    });
  }

  req.user = result.decoded;
  next();
};
