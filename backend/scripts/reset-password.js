#!/usr/bin/env node
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const username = process.argv[2];
const newPassword = process.argv[3];
const newRole = process.argv[4];

if (!username || !newPassword) {
  console.error('Uso: node reset-password.js <username> <nueva-password> [rol]');
  console.error('  rol opcional: admin | editor | viewer');
  process.exit(1);
}

if (newPassword.length < 4) {
  console.error('La contraseña debe tener al menos 4 caracteres');
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { username } });
if (!user) {
  console.error(`No existe el usuario "${username}"`);
  process.exit(1);
}

const data = {
  password: hashPassword(newPassword),
  active: true,
};
if (newRole) data.role = newRole;

await prisma.user.update({ where: { id: user.id }, data });
console.log(`OK: "${username}" -> password reseteada${newRole ? `, rol = ${newRole}` : ` (rol actual: ${user.role})`}`);
await prisma.$disconnect();
