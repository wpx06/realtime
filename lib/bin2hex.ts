export function bin2uuid(input: string): string {
  const hex = Array.from(input)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');

  // Pastikan panjangnya 32 karakter hex (16 byte)
  const padded = hex.padEnd(32, '0').slice(0, 32); // slice jaga-jaga agar tidak lebih

  return [
    padded.slice(0, 8),
    padded.slice(8, 12),
    padded.slice(12, 16),
    padded.slice(16, 20),
    padded.slice(20, 32),
  ].join('-');
}

export function uuid2bin(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return hex.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
}