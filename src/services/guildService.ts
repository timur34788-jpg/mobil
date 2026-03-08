import { db, auth } from '../firebase';
import { ref, onValue, push, set, get, update, remove, off } from 'firebase/database';

// ─── GUILD OLUŞTUR ────────────────────────────────────────────────────────────
export async function createGuild(name: string, emoji: string, color: string, userId: string, username: string) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const guildRef = push(ref(db, 'guilds'));
  const guildId = guildRef.key!;
  await set(guildRef, {
    id: guildId,
    name,
    emoji,
    color,
    owner_id: userId,
    invite_code: inviteCode,
    created_at: new Date().toISOString(),
    member_count: 1,
  });
  // Owner'ı ekle
  await set(ref(db, `guilds/${guildId}/members/${userId}`), 'owner');
  await set(ref(db, `userGuilds/${userId}/${guildId}`), true);
  // Default kanallar oluştur
  await set(ref(db, `channels/guild_${guildId}_genel`), { name: 'genel', type: 'text', category: 'Metin Kanalları', server_id: guildId });
  await set(ref(db, `channels/guild_${guildId}_duyurular`), { name: 'duyurular', type: 'text', category: 'Bilgi', server_id: guildId });
  return { guildId, inviteCode };
}

// ─── GUILD'E KATIL (davet kodu ile) ──────────────────────────────────────────
export async function joinGuildByCode(inviteCode: string, userId: string) {
  const snap = await get(ref(db, 'guilds'));
  const guilds = snap.val() || {};
  const entry = Object.entries(guilds).find(([, g]: any) => g.invite_code === inviteCode.toUpperCase());
  if (!entry) throw new Error('Geçersiz davet kodu');
  const [guildId, guild]: any = entry;
  // Zaten üye mi?
  const memberSnap = await get(ref(db, `guilds/${guildId}/members/${userId}`));
  if (memberSnap.exists()) throw new Error('Zaten bu sunucudasın');
  await set(ref(db, `guilds/${guildId}/members/${userId}`), 'member');
  await set(ref(db, `userGuilds/${userId}/${guildId}`), true);
  await update(ref(db, `guilds/${guildId}`), { member_count: (guild.member_count || 1) + 1 });
  return { guildId, name: guild.name };
}

// ─── GUILD'DEN AYRIL ─────────────────────────────────────────────────────────
export async function leaveGuild(guildId: string, userId: string) {
  await remove(ref(db, `guilds/${guildId}/members/${userId}`));
  await remove(ref(db, `userGuilds/${userId}/${guildId}`));
}

// ─── KULLANICINın GUILD'LERİNİ DİNLE ─────────────────────────────────────────
export function listenUserGuilds(userId: string, callback: (guilds: any[]) => void) {
  const r = ref(db, `userGuilds/${userId}`);
  onValue(r, async snap => {
    const data = snap.val() || {};
    const guildIds = Object.keys(data);
    if (guildIds.length === 0) { callback([]); return; }
    const guilds: any[] = [];
    for (const gid of guildIds) {
      const gs = await get(ref(db, `guilds/${gid}`));
      if (gs.exists()) guilds.push({ id: gid, ...gs.val() });
    }
    callback(guilds);
  });
  return () => off(r);
}

// ─── TÜM PUBLIC GUILD'LERİ DİNLE ─────────────────────────────────────────────
export function listenAllGuilds(callback: (guilds: any[]) => void) {
  const r = ref(db, 'guilds');
  onValue(r, snap => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
  });
  return () => off(r);
}

// ─── GUILD ÜYELERİNİ DİNLE ───────────────────────────────────────────────────
export function listenGuildMembers(guildId: string, callback: (members: any[]) => void) {
  const r = ref(db, `guilds/${guildId}/members`);
  onValue(r, snap => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([uid, role]) => ({ uid, role })));
  });
  return () => off(r);
}

// ─── ROL DEĞİŞTİR ────────────────────────────────────────────────────────────
export async function setMemberRole(guildId: string, memberId: string, role: 'admin' | 'member') {
  await set(ref(db, `guilds/${guildId}/members/${memberId}`), role);
}

// ─── ÜYEYİ AT ────────────────────────────────────────────────────────────────
export async function kickMember(guildId: string, memberId: string) {
  await remove(ref(db, `guilds/${guildId}/members/${memberId}`));
  await remove(ref(db, `userGuilds/${memberId}/${guildId}`));
}

// ─── GUILD SİL ───────────────────────────────────────────────────────────────
export async function deleteGuild(guildId: string) {
  await remove(ref(db, `guilds/${guildId}`));
}
