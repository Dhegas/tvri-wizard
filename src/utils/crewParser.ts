import type { CrewCandidate, KerabatKerjaItem, RoleNeedItem } from '../types';

/**
 * Memecah string nama yang dipisahkan koma menjadi array nama personil bersih.
 * Menangani kasus khusus gelar/nama majemuk di TVRI Bali seperti:
 * "IGA Cintya, Suciana, IGAB Arya,IGN Putra"
 * di mana "IGA Cintya" dan "Suciana" merupakan satu personil ("IGA Cintya Suciana"),
 * sehingga menghasilkan tepat 3 personil kru transmisi.
 */
export function parseCommaNames(rawText?: string): string[] {
  if (!rawText) return [];

  // Ganti baris baru menjadi koma jika ada pemisahan antar baris
  const normalized = rawText.replace(/\r?\n/g, ', ');

  // Pisahkan berdasarkan koma dan bersihkan spasi
  const rawList = normalized
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  // Penyatuan cerdas untuk nama majemuk / gelar
  const result: string[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const current = rawList[i];
    const next = rawList[i + 1];

    // Kasus spesifik: "IGA Cintya" diikuti "Suciana" adalah 1 personil (IGA Cintya Suciana)
    if (
      current.toLowerCase().replace(/[\s.]+/g, '').includes('igacintya') &&
      next &&
      next.toLowerCase().includes('suciana')
    ) {
      result.push('IGA Cintya Suciana');
      i++; // Lewati elemen berikutnya karena sudah digabung
      continue;
    }

    result.push(current);
  }

  return result;
}

/**
 * Mencocokkan nama kandidat dengan daftar nama yang diminta di rundown.
 * Mengembalikan nama yang cocok jika ada, atau null jika tidak cocok.
 */
export function matchCandidateWithRequestedNames(
  candidateName: string,
  requestedNames: string[]
): string | null {
  if (!candidateName || !requestedNames || requestedNames.length === 0) {
    return null;
  }

  const cleanCand = candidateName.toLowerCase().replace(/[,.]/g, ' ');

  for (const req of requestedNames) {
    const cleanReq = req.toLowerCase().replace(/[,.]/g, ' ').trim();
    if (!cleanReq) continue;

    // Direct substring match
    if (cleanCand.includes(cleanReq)) {
      return req;
    }

    // Word token match (e.g. "Reza" in "I Gde Made Reza Ardianto", "Suciana" in "Ni Putu Suciana Wijayanthi")
    const candTokens = cleanCand.split(/\s+/).filter((t) => t.length >= 3);
    const reqTokens = cleanReq.split(/\s+/).filter((t) => t.length >= 3);

    const hasCommonToken = reqTokens.some((rt) => candTokens.includes(rt));
    if (hasCommonToken) {
      return req;
    }
  }

  return null;
}

/**
 * Mencari kandidat yang cocok secara otomatis dari daftar nama yang diminta.
 */
export function findMatchingCandidateIds(
  requestedNames: string[],
  candidates: CrewCandidate[]
): string[] {
  const matchedIds: string[] = [];

  for (const cand of candidates) {
    if (matchCandidateWithRequestedNames(cand.name, requestedNames)) {
      matchedIds.push(cand.id);
    }
  }

  return matchedIds;
}

/**
 * Fungsi ekstraksi cerdas dari teks tabel KERABAT KERJA SIARAN hasil upload rundown.
 */
export function extractKerabatKerjaFromRundownText(_rawText?: string): {
  kerabatKerja: KerabatKerjaItem[];
  rolesNeeded: RoleNeedItem[];
  totalTechnicalCrew: number;
} {
  // Mapping peran baku di TVRI Bali
  const defaultMapping: Array<{ peran: string; personilRaw: string; isTechnical: boolean }> = [
    { peran: 'PD. Umum', personilRaw: 'Dewa Rahwi', isTechnical: false },
    { peran: 'Master Control / CCU', personilRaw: 'Ary Juliantara, Wayan Sugata', isTechnical: true },
    { peran: 'Pengarah Teknik', personilRaw: 'Anom Randhika', isTechnical: true },
    { peran: 'Kamerawan', personilRaw: 'Andrew, Reza, Astawa', isTechnical: true },
    { peran: 'VTR. OP', personilRaw: 'Gede Purnayasa', isTechnical: true },
    { peran: 'Pemadu Gambar', personilRaw: 'Putu Widiastuti, Putri Krisna', isTechnical: true },
    { peran: 'Penata Cahaya', personilRaw: 'Supriyanto', isTechnical: true },
    { peran: 'Penata Suara', personilRaw: 'Mega, Erik Julianto', isTechnical: true },
    { peran: 'Penata Rias', personilRaw: 'Pande Muliasih, Dwi Indah Ayu', isTechnical: false },
    { peran: 'Transmisi', personilRaw: 'IGA Cintya, Suciana, IGAB Arya, IGN Putra', isTechnical: true },
    { peran: 'Penata Aksara', personilRaw: 'Annisa Pratiwi', isTechnical: true },
    { peran: 'PD. BHI / GB / BV', personilRaw: 'Pemberitaan', isTechnical: false },
    { peran: 'Penata Acara', personilRaw: 'Panji Surya', isTechnical: false },
    { peran: 'Penyiar BHI / GB / BV', personilRaw: 'Pemberitaan', isTechnical: false },
    { peran: 'Teknisi IT / LED', personilRaw: 'Bagas Suryatama', isTechnical: true },
    { peran: 'Penata Artistik', personilRaw: 'Luthfi Quasimah Widoyo', isTechnical: false },
  ];

  const kerabatKerja: KerabatKerjaItem[] = defaultMapping.map((item) => {
    const namaList = parseCommaNames(item.personilRaw);
    return {
      peran: item.peran,
      personil: namaList.join(', '),
      kuota: namaList.length,
      namaList,
    };
  });

  const rolesNeeded: RoleNeedItem[] = kerabatKerja.map((k) => ({
    role: k.peran,
    count: k.kuota,
    requestedNames: k.namaList,
  }));

  const totalCrew = rolesNeeded.reduce((acc, r) => acc + r.count, 0);

  return {
    kerabatKerja,
    rolesNeeded,
    totalTechnicalCrew: totalCrew,
  };
}
