import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export { prisma };

export function isAuthEnabled() {
  return process.env.AUTH_ENABLED !== 'false';
}

export function validateSecret() {
  getSecret();
  return true;
}

function getSecret() {
  if (process.env.AUTH_ENABLED === 'false') {
    return process.env.AUTH_SECRET || 'asamapp-dev-secret-change-me';
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_SECRET no esta definido. Es requerido en produccion para firmar tokens de forma segura. ' +
        'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    console.warn(
      '[auth] ADVERTENCIA: AUTH_SECRET no definido, usando valor de desarrollo inseguro. ' +
      'Define AUTH_SECRET antes de desplegar en produccion.'
    );
    return 'asamapp-dev-secret-change-me';
  }
  if (secret === 'asamapp-dev-secret-change-me' && process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET tiene el valor por defecto de desarrollo. ' +
      'Cambialo antes de desplegar en produccion. ' +
      'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex') === key;
}

export function signToken(userId) {
  const issuedAt = Date.now();
  const payload = `${userId}:${issuedAt}`;
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const signature = parts.pop();
    const issuedAt = Number(parts.pop());
    const userId = parts.join(':');
    const payload = `${userId}:${issuedAt}`;
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (signature !== expected) return null;
    if (Date.now() - issuedAt > TOKEN_TTL_MS) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function authMiddleware(req, res, next) {
  if (!req.path.startsWith('/api')) return next();
  if (!isAuthEnabled()) return next();

  const publicPaths = ['/api/health', '/api/auth/config', '/api/auth/login', '/api/auth/register'];
  if (publicPaths.includes(req.path)) return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesion.' });
  }
  const userId = verifyToken(token);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, active: true },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuario inactivo o inexistente' });
    }
    req.user = user;
  } catch {
    return res.status(500).json({ error: 'Error al validar sesion' });
  }

  return next();
}

export async function handleAuthRegister(req, res) {
  try {
    const { email, username, password } = req.body || {};
    if (!email?.trim() || !username?.trim() || !password) {
      return res.status(400).json({ error: 'Email, usuario y contraseña son requeridos' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(403).json({ error: 'El registro esta deshabilitado. Pedile a un administrador que cree tu cuenta.' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.trim() }, { username: username.trim() }] },
    });
    if (existing) {
      const field = existing.email === email.trim() ? 'email' : 'usuario';
      return res.status(409).json({ error: `Ese ${field} ya está registrado` });
    }

    const user = await prisma.user.create({
      data: { email: email.trim(), username: username.trim(), password: hashPassword(password), role: 'admin' },
    });
    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

export async function handleAuthLogin(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (!user || !user.active || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function handleAuthMe(req, res) {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  res.json({ user: req.user });
}

export async function handleAuthConfig(_req, res) {
  try {
    const count = await prisma.user.count();
    res.json({ enabled: true, hasUsers: count > 0 });
  } catch {
    res.json({ enabled: true, hasUsers: false });
  }
}
